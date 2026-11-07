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
  mutateJobState,
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
  const items = [{ description: 'Vệ sinh dàn lạnh', price: 180000, quantity: 1 }];
  const createdAt = '2026-11-06T10:00:00Z';
  const approvedAt = '2026-11-06T10:15:00Z';
  const hash = computeQuotationHash(1, items, 180000, createdAt);

  const validApprovedRev: QuotationRevision = {
    revisionNumber: 1,
    hash,
    items,
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai (Chủ hộ)',
    approvedAt,
    createdAt,
    approvalEvidence: {
      approvedByCustomer: true,
      confirmationMethod: 'homeowner_portal_signature',
      approverName: 'Chị Mai (Chủ hộ)',
      approvedAt,
      approvedRevisionNumber: 1,
      hash,
      snapshotTotal: 180000,
      isSimulatedVerification: true,
    },
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
  const reason = 'Bảo trì vệ sinh định kỳ theo giá niêm yết chuẩn, không phát sinh linh kiện';
  const waivedAt = '2026-11-06T10:05:00Z';
  const validWaiverRev: QuotationRevision = {
    revisionNumber: 1,
    hash: 'WAIVER-1',
    items: [{ description: 'Vệ sinh dàn lạnh tiêu chuẩn', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'waived',
    waiverReason: reason,
    customerAcknowledged: true,
    createdAt: waivedAt,
    approvedAt: waivedAt,
    waiverEvidence: {
      waived: true,
      waiverReason: reason,
      customerAcknowledged: true,
      waivedAt,
      waivedBy: 'Chị Mai (Chủ hộ)',
      isSimulatedVerification: true,
    },
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

test('P1: blocks technician from operating on an UNASSIGNED job', () => {
  const unassignedJob: Job = { ...baseJob, assignedTechnicianId: undefined };
  const res = validateJobTransition({
    job: unassignedJob,
    targetStatus: 'DANG_TOI',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(res.allowed, false);
  assert.equal(res.code, 'NOT_ASSIGNED');
  assert.match(res.error || '', /chưa được phân công/);
});

test('P1: getVisibleJobsForUser excludes unassigned jobs for technician role', () => {
  const jobList: Job[] = [
    { ...baseJob, id: 'JOB-1', assignedTechnicianId: 'tech-01' },
    { ...baseJob, id: 'JOB-2', assignedTechnicianId: undefined }, // unassigned
    { ...baseJob, id: 'JOB-3', assignedTechnicianId: 'tech-02' },
  ];

  const techVisible = getVisibleJobsForUser(jobList, mockTechUser, 'org-01');
  assert.equal(techVisible.length, 1);
  assert.equal(techVisible[0].id, 'JOB-1');

  const ownerVisible = getVisibleJobsForUser(jobList, mockOwnerUser, 'org-01');
  assert.equal(ownerVisible.length, 3, 'Owner sees assigned and unassigned jobs');
});

// ============================================================================
// P0-02: LATEST QUOTATION REVISION SUPERSEDING TESTS
// ============================================================================

test('P0-02: Rev 1 approved is superseded when Rev 2 is created pending_homeowner', () => {
  const rev1Approved: QuotationRevision = {
    revisionNumber: 1,
    hash: 'REV1-11111111',
    items: [{ description: 'Vệ sinh tiêu chuẩn', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai',
    approvedAt: '2026-11-06T10:00:00Z',
    createdAt: '2026-11-06T09:50:00Z',
    approvalEvidence: {
      approvedByCustomer: true,
      confirmationMethod: 'homeowner_portal_signature',
      approverName: 'Chị Mai',
      approvedAt: '2026-11-06T10:00:00Z',
      approvedRevisionNumber: 1,
      hash: 'REV1-11111111',
      snapshotTotal: 180000,
      isSimulatedVerification: true,
    },
  };

  const rev2Pending: QuotationRevision = {
    revisionNumber: 2,
    hash: 'REV2-22222222',
    items: [
      { description: 'Vệ sinh tiêu chuẩn', price: 180000, quantity: 1 },
      { description: 'Thay tụ quạt dàn lạnh', price: 250000, quantity: 1 },
    ],
    subtotal: 430000,
    discount: 0,
    total: 430000,
    status: 'pending_homeowner',
    createdAt: '2026-11-06T10:20:00Z',
  };

  // Job has Rev 1 approved, but latest is Rev 2 pending
  const jobWithSupersededRev: Job = {
    ...baseJob,
    quotationRevisions: [rev1Approved, rev2Pending],
  };

  assert.equal(hasValidQuotationAuthorization(jobWithSupersededRev), false);

  const transitionRes = validateJobTransition({
    job: jobWithSupersededRev,
    targetStatus: 'DANG_SUA',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });

  assert.equal(transitionRes.allowed, false);
  assert.equal(transitionRes.code, 'QUO_001_REQUIRED');
  assert.match(transitionRes.error || '', /phiên bản hiện hành/);
});

test('P0-02: Rev 1 approved is superseded when Rev 2 is rejected by customer', () => {
  const rev1Approved: QuotationRevision = {
    revisionNumber: 1,
    hash: 'REV1-11111111',
    items: [{ description: 'Vệ sinh tiêu chuẩn', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai',
    approvedAt: '2026-11-06T10:00:00Z',
    createdAt: '2026-11-06T09:50:00Z',
  };

  const rev2Rejected: QuotationRevision = {
    revisionNumber: 2,
    hash: 'REV2-22222222',
    items: [{ description: 'Thay tụ quạt', price: 300000, quantity: 1 }],
    subtotal: 300000,
    discount: 0,
    total: 300000,
    status: 'rejected',
    createdAt: '2026-11-06T10:20:00Z',
  };

  const jobWithRejectedRev: Job = {
    ...baseJob,
    quotationRevisions: [rev1Approved, rev2Rejected],
  };

  assert.equal(hasValidQuotationAuthorization(jobWithRejectedRev), false);
});

test('P0-02: Rev 2 approved by customer successfully re-authorizes repair', () => {
  const rev1Approved: QuotationRevision = {
    revisionNumber: 1,
    hash: 'REV1-11111111',
    items: [{ description: 'Vệ sinh tiêu chuẩn', price: 180000, quantity: 1 }],
    subtotal: 180000,
    discount: 0,
    total: 180000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai',
    approvedAt: '2026-11-06T10:00:00Z',
    createdAt: '2026-11-06T09:50:00Z',
  };

  const rev2Items = [
    { description: 'Vệ sinh tiêu chuẩn', price: 180000, quantity: 1 },
    { description: 'Thay tụ quạt dàn lạnh', price: 250000, quantity: 1 },
  ];
  const rev2CreatedAt = '2026-11-06T10:20:00Z';
  const rev2ApprovedAt = '2026-11-06T10:35:00Z';
  const rev2Hash = computeQuotationHash(2, rev2Items, 430000, rev2CreatedAt);

  const rev2Approved: QuotationRevision = {
    revisionNumber: 2,
    hash: rev2Hash,
    items: rev2Items,
    subtotal: 430000,
    discount: 0,
    total: 430000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai',
    approvedAt: rev2ApprovedAt,
    createdAt: rev2CreatedAt,
    approvalEvidence: {
      approvedByCustomer: true,
      confirmationMethod: 'homeowner_portal_signature',
      approverName: 'Chị Mai',
      approvedAt: rev2ApprovedAt,
      approvedRevisionNumber: 2,
      hash: rev2Hash,
      snapshotTotal: 430000,
      isSimulatedVerification: true,
    },
  };

  const jobRev2Approved: Job = {
    ...baseJob,
    quotationRevisions: [rev1Approved, rev2Approved],
  };

  assert.equal(hasValidQuotationAuthorization(jobRev2Approved), true);
  const res = validateJobTransition({
    job: jobRev2Approved,
    targetStatus: 'DANG_SUA',
    currentUser: mockTechUser,
    currentOrg: mockOrg,
  });
  assert.equal(res.allowed, true);
});

// ============================================================================
// P0-03: CENTRAL JOB MUTATION SERVICE (mutateJobState) & BYPASS ATTEMPTS
// ============================================================================

test('P0-03: mutateJobState blocks unauthorized status jump bypassing transition guard', () => {
  const freshJob: Job = { ...baseJob, status: 'MOI', quotationRevisions: [] };
  const mutationResult = mutateJobState(
    freshJob,
    { status: 'DANG_SUA' }, // Attempting to bypass straight to DANG_SUA
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );

  assert.equal(mutationResult.success, false);
  assert.equal(mutationResult.code, 'INVALID_TRANSITION');
});

test('P0-03: mutateJobState blocks moving to DANG_SUA without approved quotation', () => {
  const quoteJob: Job = { ...baseJob, status: 'BAO_GIA', quotationRevisions: [] };
  const mutationResult = mutateJobState(
    quoteJob,
    { status: 'DANG_SUA' },
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );

  assert.equal(mutationResult.success, false);
  assert.equal(mutationResult.code, 'QUO_001_REQUIRED');
});

test('P0-03: mutateJobState blocks cross-tenant mutation attempt', () => {
  const crossJob: Job = { ...baseJob, organizationId: 'org-OTHER' };
  const mutationResult = mutateJobState(
    crossJob,
    { checklist: { ...baseJob.checklist, filterCleaned: true } },
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );

  assert.equal(mutationResult.success, false);
  assert.equal(mutationResult.code, 'TENANT_MISMATCH');
});

test('P0-03: mutateJobState blocks technician updating unassigned job or other technician job', () => {
  const otherTechJob: Job = { ...baseJob, assignedTechnicianId: 'tech-02' };
  const resOther = mutateJobState(
    otherTechJob,
    { checklist: { ...baseJob.checklist, filterCleaned: true } },
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );
  assert.equal(resOther.success, false);
  assert.equal(resOther.code, 'NOT_ASSIGNED');

  const unassignedJob: Job = { ...baseJob, assignedTechnicianId: undefined };
  const resUnassigned = mutateJobState(
    unassignedJob,
    { checklist: { ...baseJob.checklist, filterCleaned: true } },
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );
  assert.equal(resUnassigned.success, false);
  assert.equal(resUnassigned.code, 'NOT_ASSIGNED');
});

test('P0-03: mutateJobState blocks technician attempting to reassign job', () => {
  const mutationResult = mutateJobState(
    baseJob,
    { assignedTechnicianId: 'tech-02' }, // Tech trying to reassign to someone else
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );

  assert.equal(mutationResult.success, false);
  assert.equal(mutationResult.code, 'ROLE_UNAUTHORIZED');
});

test('P0-03: mutateJobState blocks mutations when organization subscription is read_only or suspended', () => {
  const resRo = mutateJobState(
    baseJob,
    { discount: 50000 },
    { currentUser: mockTechUser, currentOrg: mockReadOnlyOrg }
  );
  assert.equal(resRo.success, false);
  assert.equal(resRo.code, 'SUBSCRIPTION_LOCKED');

  const resSusp = mutateJobState(
    baseJob,
    { discount: 50000 },
    { currentUser: mockTechUser, currentOrg: mockSuspendedOrg }
  );
  assert.equal(resSusp.success, false);
  assert.equal(resSusp.code, 'SUBSCRIPTION_LOCKED');
});

test('P0-03: mutateJobState applies valid mutation and strictly preserves immutable fields', () => {
  const validMutation = mutateJobState(
    baseJob,
    {
      id: 'TAMPERED-ID', // Should be ignored and preserved
      organizationId: 'TAMPERED-ORG', // Should be ignored or rejected
      discount: 20000,
    },
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );

  // If organizationId in update payload doesn't match currentOrg, it's rejected
  assert.equal(validMutation.success, false);

  const cleanMutation = mutateJobState(
    baseJob,
    {
      discount: 20000,
      checklist: { ...baseJob.checklist, filterCleaned: true },
    },
    { currentUser: mockTechUser, currentOrg: mockOrg }
  );

  assert.equal(cleanMutation.success, true);
  assert.equal(cleanMutation.job?.id, baseJob.id, 'Job ID must remain intact');
  assert.equal(cleanMutation.job?.organizationId, baseJob.organizationId, 'Tenant must remain intact');
  assert.equal(cleanMutation.job?.discount, 20000);
  assert.equal(cleanMutation.job?.checklist.filterCleaned, true);
});

// ============================================================================
// P0-01 (v3.1): OPERATION ALLOWLIST & FORBIDDEN MUTATION TESTS
// ============================================================================

test('P0-01: mutateJobState rejects technician attempting to forge paymentEntries or paymentStatus', () => {
  const forgedPaymentMutation = mutateJobState(
    baseJob,
    {
      paymentStatus: 'paid',
      paymentEntries: [
        {
          id: 'FORGED-PAY',
          jobId: baseJob.id,
          amount: 500000,
          type: 'payment',
          method: 'TIEN_MAT',
          recordedBy: 'Thợ tự ghi',
          recordedAt: new Date().toISOString(),
        },
      ],
    },
    { currentUser: mockTechUser, currentOrg: mockOrg, operation: 'PAYMENT_RECORD' }
  );

  assert.equal(forgedPaymentMutation.success, false);
  assert.equal(forgedPaymentMutation.code, 'ROLE_UNAUTHORIZED');
});

test('P0-01: mutateJobState rejects technician injecting fields outside allowlist (e.g. assignedTechnicianId during technical update)', () => {
  const forgedFieldMutation = mutateJobState(
    baseJob,
    {
      checklist: { ...baseJob.checklist, filterCleaned: true },
      assignedTechnicianId: 'tech-02', // Not allowed in TECHNICAL_UPDATE
    },
    { currentUser: mockTechUser, currentOrg: mockOrg, operation: 'TECHNICAL_UPDATE' }
  );

  assert.equal(forgedFieldMutation.success, false);
  assert.equal(forgedFieldMutation.code, 'FORBIDDEN_FIELD_MUTATION');
});

test('P0-01: mutateJobState allows owner/manager to record payment entries via PAYMENT_RECORD operation', () => {
  const validPaymentMutation = mutateJobState(
    baseJob,
    {
      paymentStatus: 'paid',
      paymentEntries: [
        {
          id: 'LEDGER-01',
          jobId: baseJob.id,
          amount: 180000,
          type: 'payment',
          method: 'TIEN_MAT',
          recordedBy: 'Nguyễn Văn Minh (Chủ cơ sở)',
          recordedAt: new Date().toISOString(),
        },
      ],
    },
    { currentUser: mockOwnerUser, currentOrg: mockOrg, operation: 'PAYMENT_RECORD' }
  );

  assert.equal(validPaymentMutation.success, true);
  assert.equal(validPaymentMutation.job?.paymentStatus, 'paid');
  assert.equal(validPaymentMutation.job?.paymentEntries?.length, 1);
});

// ============================================================================
// P0-02 (v3.1): QUOTATION APPROVAL INTEGRITY & TAMPERING DETECTION TESTS
// ============================================================================

test('P0-02: hasValidQuotationAuthorization rejects approved revision if approvalEvidence is missing', () => {
  const revWithoutEvidence: QuotationRevision = {
    revisionNumber: 1,
    hash: computeQuotationHash(1, [{ description: 'Test', price: 100000, quantity: 1 }], 100000, '2026-11-06T10:00:00Z'),
    items: [{ description: 'Test', price: 100000, quantity: 1 }],
    subtotal: 100000,
    discount: 0,
    total: 100000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai',
    approvedAt: '2026-11-06T10:30:00Z',
    createdAt: '2026-11-06T10:00:00Z',
    // approvalEvidence is missing!
  };

  const jobWithMissingEvidence: Job = {
    ...baseJob,
    quotationRevisions: [revWithoutEvidence],
  };

  assert.equal(hasValidQuotationAuthorization(jobWithMissingEvidence), false);
});

test('P0-02: hasValidQuotationAuthorization rejects revision if snapshot items were tampered after hash generation', () => {
  const originalItems = [{ description: 'Vệ sinh dàn lạnh', price: 180000, quantity: 1 }];
  const hash = computeQuotationHash(1, originalItems, 180000, '2026-11-06T10:00:00Z');

  const tamperedRevision: QuotationRevision = {
    revisionNumber: 1,
    hash,
    // Attacker altered items list or price without updating hash!
    items: [{ description: 'Vệ sinh dàn lạnh + Thay block', price: 1800000, quantity: 1 }],
    subtotal: 1800000,
    discount: 0,
    total: 1800000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai',
    approvedAt: '2026-11-06T10:30:00Z',
    createdAt: '2026-11-06T10:00:00Z',
    approvalEvidence: {
      approvedByCustomer: true,
      confirmationMethod: 'homeowner_portal_signature',
      approverName: 'Chị Mai',
      approvedAt: '2026-11-06T10:30:00Z',
      approvedRevisionNumber: 1,
      hash,
      snapshotTotal: 1800000,
      isSimulatedVerification: true,
    },
  };

  const jobWithTamperedSnapshot: Job = {
    ...baseJob,
    quotationRevisions: [tamperedRevision],
  };

  assert.equal(hasValidQuotationAuthorization(jobWithTamperedSnapshot), false);
});

test('P0-02: mutateJobState blocks tampering with past immutable quotation snapshots', () => {
  const rev1Items = [{ description: 'Item 1', price: 100000, quantity: 1 }];
  const rev1Hash = computeQuotationHash(1, rev1Items, 100000, '2026-11-06T10:00:00Z');
  const rev1: QuotationRevision = {
    revisionNumber: 1,
    hash: rev1Hash,
    items: rev1Items,
    subtotal: 100000,
    discount: 0,
    total: 100000,
    status: 'approved',
    approvedByCustomer: true,
    approverName: 'Chị Mai',
    approvedAt: '2026-11-06T10:30:00Z',
    createdAt: '2026-11-06T10:00:00Z',
  };

  const jobWithRev1: Job = { ...baseJob, quotationRevisions: [rev1] };

  // Attempting to modify rev1 while adding rev2
  const tamperedRev1: QuotationRevision = {
    ...rev1,
    total: 999999, // Tampered past snapshot
    hash: 'FAKE-HASH',
  };
  const rev2: QuotationRevision = {
    revisionNumber: 2,
    hash: 'REV2-NEW',
    items: [],
    subtotal: 50000,
    discount: 0,
    total: 50000,
    status: 'pending_homeowner',
    createdAt: '2026-11-06T11:00:00Z',
  };

  const mutateRes = mutateJobState(
    jobWithRev1,
    { quotationRevisions: [tamperedRev1, rev2] },
    { currentUser: mockTechUser, currentOrg: mockOrg, operation: 'QUOTE_REVISION_CREATE' }
  );

  assert.equal(mutateRes.success, false);
  assert.equal(mutateRes.code, 'IMMUTABLE_VIOLATION');
});


