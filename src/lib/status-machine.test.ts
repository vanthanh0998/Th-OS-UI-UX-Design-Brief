import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionTo,
  getNextStatus,
  STATUS_MAP,
  validateJobTransition,
  hasValidQuotationAuthorization,
  computeQuotationHash,
  canPerformWriteOperation,
  getVisibleJobsForUser,
} from './status-machine';
import { Job, Organization, StaffUser, QuotationRevision } from './types';

const mockOrg: Organization = {
  id: 'org-01',
  name: 'Điện Lạnh Sài Gòn',
  shortCode: 'DLSG',
  phone: '0901234567',
  address: '123 Cách Mạng Tháng 8',
  city: 'Hồ Chí Minh',
  subscriptionTier: 'standard',
  subscriptionStatus: 'active',
  memberCount: 5,
};

const mockReadOnlyOrg: Organization = {
  ...mockOrg,
  id: 'org-ro',
  subscriptionStatus: 'read_only',
};

const mockSuspendedOrg: Organization = {
  ...mockOrg,
  id: 'org-susp',
  subscriptionStatus: 'suspended',
};

const mockTechUser: StaffUser = {
  id: 'tech-01',
  fullName: 'Trần Văn Hùng',
  phone: '0912345678',
  email: 'hung@dlsg.vn',
  role: 'technician',
  organizationId: 'org-01',
  active: true,
};

const mockOtherTechUser: StaffUser = {
  id: 'tech-02',
  fullName: 'Lê Hoàng Nam',
  phone: '0912345679',
  email: 'nam@dlsg.vn',
  role: 'technician',
  organizationId: 'org-01',
  active: true,
};

const mockOwnerUser: StaffUser = {
  id: 'owner-01',
  fullName: 'Nguyễn Văn Minh',
  phone: '0909888999',
  email: 'minh@dlsg.vn',
  role: 'owner',
  organizationId: 'org-01',
  active: true,
};

const baseJob: Job = {
  id: 'JOB-TEST-001',
  organizationId: 'org-01',
  customerName: 'Chị Mai',
  customerPhone: '0903111222',
  address: 'Masteri Thảo Điền T2-1402',
  district: 'Thành phố Thủ Đức',
  scheduledDate: 'Hôm nay',
  scheduledTime: '14:00 - 16:00',
  airconType: 'TREO_TUONG',
  brand: 'Daikin',
  horsePower: '1.5 HP',
  serviceType: 'VE_SINH',
  symptoms: ['Chảy nước', 'Làm lạnh yếu'],
  status: 'BAO_GIA',
  paymentStatus: 'unpaid',
  assignedTechnicianId: 'tech-01',
  checklist: {
    drainPipeCleared: false,
    filterCleaned: false,
    outdoorCoilCleaned: false,
    electricalTightened: false,
  },
  selectedServices: [{ serviceId: 'VE_SINH_TREO_TUONG_15HP', quantity: 1, price: 180000 }],
  spareParts: [],
  photosBefore: [],
  photosAfter: [],
  discount: 0,
  createdAt: '2026-11-06T10:00:00Z',
};

test('status machine allows forward progression', () => {
  assert.equal(canTransitionTo('MOI', 'DANG_TOI'), true);
  assert.equal(canTransitionTo('DANG_TOI', 'DANG_KIEM_TRA'), true);
  assert.equal(canTransitionTo('DANG_KIEM_TRA', 'BAO_GIA'), true);
  assert.equal(canTransitionTo('BAO_GIA', 'DANG_SUA'), true);
  assert.equal(canTransitionTo('DANG_SUA', 'HOAN_THANH'), true);
});

test('status machine disallows skipping forward without intermediate steps', () => {
  assert.equal(canTransitionTo('MOI', 'HOAN_THANH'), false);
  assert.equal(canTransitionTo('DANG_TOI', 'DANG_SUA'), false);
});

test('status machine allows cancellation from in-flight states', () => {
  assert.equal(canTransitionTo('MOI', 'DA_HUY'), true);
  assert.equal(canTransitionTo('DANG_TOI', 'DA_HUY'), true);
  assert.equal(canTransitionTo('HOAN_THANH', 'DA_HUY'), false);
});

test('getNextStatus returns valid step sequence', () => {
  assert.equal(getNextStatus('MOI'), 'DANG_TOI');
  assert.equal(getNextStatus('DANG_SUA'), 'HOAN_THANH');
  assert.equal(getNextStatus('HOAN_THANH'), null);
});

test('STATUS_MAP contains correct standardized labels', () => {
  assert.equal(STATUS_MAP.MOI.shortLabel, 'Chờ nhận ca');
  assert.equal(STATUS_MAP.DANG_TOI.label, 'Thợ đang trên đường đến');
  assert.equal(STATUS_MAP.HOAN_THANH.shortLabel, 'Đã hoàn thành');
});

// ============================================================================
// P0-01: QUO-001 INVARIANTS & REVISION VERIFICATION
// ============================================================================

test('computeQuotationHash generates deterministic and tamper-evident hash', () => {
  const items = [{ description: 'Vệ sinh dàn lạnh', price: 180000, quantity: 1 }];
  const hash1 = computeQuotationHash(1, items, 180000, '2026-11-06T10:00:00Z');
  const hash2 = computeQuotationHash(1, items, 180000, '2026-11-06T10:00:00Z');
  assert.equal(hash1, hash2, 'Identical content snapshot must produce identical hash');
  assert.match(hash1, /^REV1-[0-9A-F]{8}$/, 'Hash format must match #REV prefix and hex code');

  const tamperedItems = [{ description: 'Vệ sinh dàn lạnh', price: 250000, quantity: 1 }];
  const hashTampered = computeQuotationHash(1, tamperedItems, 250000, '2026-11-06T10:00:00Z');
  assert.notEqual(hash1, hashTampered, 'Modified items or price must produce different hash');
});

test('QUO-001: blocks transition to DANG_SUA when no quotation revision exists', () => {
  const jobWithoutQuote: Job = { ...baseJob, quotationRevisions: [] };
  const res = validateJobTransition({
    job: jobWithoutQuote,
    targetStatus: 'DANG_SUA',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'QUO_001_REQUIRED');
  assert.match(res.error || '', /QUO-001/);
});

test('QUO-001: blocks transition to DANG_SUA when quotation is still pending homeowner approval', () => {
  const pendingRev: QuotationRevision = {
    revisionNumber: 1,
    hash: 'REV1-A1B2C3D4',
    items: [{ description: 'Vệ sinh dàn lạnh', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'pending_homeowner',
    createdAt: '2026-11-06T10:00:00Z',
  };

  const jobPending: Job = { ...baseJob, quotationRevisions: [pendingRev] };
  const res = validateJobTransition({
    job: jobPending,
    targetStatus: 'DANG_SUA',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'QUO_001_REQUIRED');
});

test('QUO-001: blocks transition to DANG_SUA if status is approved but lacks customer confirmation evidence', () => {
  const fakeApprovedRev: QuotationRevision = {
    revisionNumber: 1,
    hash: 'REV1-A1B2C3D4',
    items: [{ description: 'Vệ sinh dàn lạnh', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'approved',
    // Missing approvedByCustomer: true and missing approverName
    approvedByCustomer: false,
    approverName: '',
    approvedAt: '',
    createdAt: '2026-11-06T10:00:00Z',
  };

  const jobInvalidEvidence: Job = { ...baseJob, quotationRevisions: [fakeApprovedRev] };
  const res = validateJobTransition({
    job: jobInvalidEvidence,
    targetStatus: 'DANG_SUA',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'QUO_001_REQUIRED');
});

test('QUO-001: allows transition to DANG_SUA with verified customer approval evidence', () => {
  const validApprovedRev: QuotationRevision = {
    revisionNumber: 1,
    hash: 'REV1-A1B2C3D4',
    items: [{ description: 'Vệ sinh dàn lạnh', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai (Chủ hộ)',
    approvedAt: '2026-11-06T10:15:00Z',
    createdAt: '2026-11-06T10:00:00Z',
  };

  const jobApproved: Job = { ...baseJob, quotationRevisions: [validApprovedRev] };
  const res = validateJobTransition({
    job: jobApproved,
    targetStatus: 'DANG_SUA',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, true);
  assert.equal(res.error, undefined);
});

test('QUO-001: allows transition to DANG_SUA with valid customer-acknowledged quotation waiver', () => {
  const validWaiverRev: QuotationRevision = {
    revisionNumber: 1,
    hash: 'WAIVER-1',
    items: [{ description: 'Vệ sinh dàn lạnh tiêu chuẩn', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'waived',
    waiverReason: 'Bảo trì vệ sinh định kỳ theo giá niêm yết chuẩn, không phát sinh linh kiện',
    customerAcknowledged: true,
    createdAt: '2026-11-06T10:05:00Z',
    approvedAt: '2026-11-06T10:05:00Z',
  };

  const jobWaived: Job = { ...baseJob, quotationRevisions: [validWaiverRev] };
  const res = validateJobTransition({
    job: jobWaived,
    targetStatus: 'DANG_SUA',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, true);
});

// ============================================================================
// P0-02 & P1: BUSINESS TRANSITION GUARD, SUBSCRIPTION WRITE & TECHNICIAN SCOPING
// ============================================================================

test('P1: blocks transitions when organization subscription is read_only', () => {
  const res = validateJobTransition({
    job: baseJob,
    targetStatus: 'DANG_TOI',
    currentUser: mockTechUser,
    currentOrg: mockReadOnlyOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'SUBSCRIPTION_LOCKED');
  assert.match(res.error || '', /read_only/);
});

test('P1: blocks transitions when organization subscription is suspended', () => {
  const res = validateJobTransition({
    job: baseJob,
    targetStatus: 'DANG_TOI',
    currentUser: mockTechUser,
    currentOrg: mockSuspendedOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'SUBSCRIPTION_LOCKED');
  assert.match(res.error || '', /tạm ngưng|suspended/);
});

test('P1: canPerformWriteOperation strictly enforces subscription write policies', () => {
  assert.equal(canPerformWriteOperation(mockOrg).allowed, true);
  assert.equal(canPerformWriteOperation(mockReadOnlyOrg).allowed, false);
  assert.equal(canPerformWriteOperation(mockSuspendedOrg).allowed, false);
});

test('Tenant Guard: blocks transitions for jobs belonging to a different organization', () => {
  const crossTenantJob: Job = { ...baseJob, organizationId: 'org-OTHER' };
  const res = validateJobTransition({
    job: crossTenantJob,
    targetStatus: 'DANG_TOI',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'TENANT_MISMATCH');
});

test('P1: blocks technician from operating on a job assigned to another technician', () => {
  const res = validateJobTransition({
    job: baseJob, // assigned to tech-01
    targetStatus: 'DANG_TOI',
    currentUser: mockOtherTechUser, // tech-02
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'NOT_ASSIGNED');
  assert.match(res.error || '', /không được phân công/);
});

test('P1: allows owner and manager to operate on any tenant job', () => {
  const res = validateJobTransition({
    job: { ...baseJob, status: 'MOI' },
    targetStatus: 'DANG_TOI',
    currentUser: mockOwnerUser, // Owner can manage any ca in org
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, true);
});

test('P1: getVisibleJobsForUser filters jobs by assigned technician for tech role', () => {
  const jobList: Job[] = [
    { ...baseJob, id: 'JOB-1', assignedTechnicianId: 'tech-01' },
    { ...baseJob, id: 'JOB-2', assignedTechnicianId: 'tech-02' },
    { ...baseJob, id: 'JOB-3', assignedTechnicianId: 'tech-01' },
  ];

  const techVisible = getVisibleJobsForUser(jobList, mockTechUser, 'org-01');
  assert.equal(techVisible.length, 2);
  assert.deepEqual(
    techVisible.map((j) => j.id),
    ['JOB-1', 'JOB-3']
  );

  const ownerVisible = getVisibleJobsForUser(jobList, mockOwnerUser, 'org-01');
  assert.equal(ownerVisible.length, 3, 'Owner sees all jobs in the organization');
});
