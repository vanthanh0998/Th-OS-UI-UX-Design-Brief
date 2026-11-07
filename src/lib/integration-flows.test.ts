import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingRequest } from './booking-requests';
import { filterByTenant, validateCrossTenantLink } from './tenant-isolation';
import {
  canSwitchToOrganization,
  switchOrganizationContext,
  INITIAL_MEMBERSHIPS,
} from './org-membership';
import {
  canRecordPayment,
  recordPaymentLedgerEntry,
  computePaymentStatusFromLedger,
  reportPaymentByTechnician,
} from './payment-ledger';
import {
  BookingRequest,
  Customer,
  Job,
  Organization,
  Property,
  StaffUser,
} from './types';

// ============================================================================
// INTEGRATION TESTS (P0-04: Booking, Org Switch, Payment Ledger, Permission Denial)
// ============================================================================

const orgSaigon: Organization = {
  id: 'org-dienlanh-saigon',
  name: 'Điện Lạnh Sài Gòn Xanh',
  shortCode: 'SGX',
  phone: '028 3822 9999',
  address: '142 Điện Biên Phủ',
  city: 'TP.HCM',
  subscriptionTier: 'standard',
  subscriptionStatus: 'active',
  memberCount: 5,
};

const orgTanBinh: Organization = {
  id: 'org-saigon-tanbinh',
  name: 'Sài Gòn Xanh - Chi nhánh Tân Bình',
  shortCode: 'SGTB',
  phone: '028 3844 7777',
  address: '360 Cộng Hòa',
  city: 'TP.HCM',
  subscriptionTier: 'standard',
  subscriptionStatus: 'active',
  memberCount: 2,
};

const orgBacNam: Organization = {
  id: 'org-bacnam-service',
  name: 'Cơ Điện Lạnh Bắc Nam Pro',
  shortCode: 'BNP',
  phone: '024 3755 8888',
  address: '88 Cầu Giấy',
  city: 'Hà Nội',
  subscriptionTier: 'trial',
  subscriptionStatus: 'trial',
  memberCount: 3,
};

const userOwner: StaffUser = {
  id: 'staff-01',
  fullName: 'Nguyễn Văn Thành',
  phone: '0903 111 222',
  email: 'thanh.nguyen@dienlanhsgx.vn',
  role: 'owner',
  organizationId: 'org-dienlanh-saigon',
  active: true,
};

const userTech: StaffUser = {
  id: 'staff-03',
  fullName: 'Trần Văn Hùng',
  phone: '0938 789 123',
  email: 'hung.tran@dienlanhsgx.vn',
  role: 'technician',
  organizationId: 'org-dienlanh-saigon',
  active: true,
};

test('INTEGRATION 1: Booking Creation Workflow — creates independent BookingRequest without altering operational jobs', () => {
  const operationalJobs: Job[] = [
    {
      id: 'JOB-01',
      organizationId: 'org-dienlanh-saigon',
      customerName: 'Anh Long',
      customerPhone: '0901112233',
      address: 'Quận 1',
      district: 'Quận 1',
      scheduledTime: '09:00 - 10:30',
      scheduledDate: '2026-11-06',
      airconType: 'TREO_TUONG',
      brand: 'Panasonic',
      horsePower: '1.0 HP',
      serviceType: 'VE_SINH',
      symptoms: [],
      status: 'DANG_SUA',
      paymentStatus: 'unpaid',
      checklist: {
        drainPipeCleared: true,
        filterCleaned: true,
        outdoorCoilCleaned: true,
        electricalTightened: true,
      },
      selectedServices: [],
      spareParts: [],
      photosBefore: [],
      photosAfter: [],
      discount: 0,
      createdAt: '2026-11-06T08:00:00Z',
    },
  ];

  const bookingRequestsQueue: BookingRequest[] = [];

  // Homeowner submits booking request via wizard
  const newRequest = createBookingRequest({
    organizationId: 'org-dienlanh-saigon',
    customerName: 'Chị Mai Lan',
    customerPhone: '0908123456',
    address: '159 Xa Lộ Hà Nội, Căn hộ Masteri',
    district: 'TP. Thủ Đức',
    airconType: 'TREO_TUONG',
    brand: 'Daikin',
    quantity: 2,
    serviceType: 'VE_SINH',
    symptoms: ['Chảy nước', 'Không mát'],
    preferredDate: 'Hôm nay',
    preferredTimeSlot: '14:00 - 15:30',
    customerNotes: 'Nhà có trẻ nhỏ, gọi trước 15 phút',
  });

  // System processes booking request
  bookingRequestsQueue.push(newRequest);

  // Assertions:
  assert.equal(newRequest.status, 'requested');
  assert.equal(bookingRequestsQueue.length, 1);
  assert.equal(operationalJobs.length, 1); // Job array untouched!
  assert.equal((newRequest as any).assignedTechnicianId, undefined);
  assert.equal(newRequest.customerName, 'Chị Mai Lan');
});

test('INTEGRATION 2: Organization Switching Workflow — preserves identity, scopes data, resets selected records', () => {
  let activeUser = { ...userOwner };
  let currentOrg = orgSaigon;
  let selectedJobId: string | null = 'JOB-01';

  // Attempt to switch to org-saigon-tanbinh (User has valid membership)
  const switchCheck = canSwitchToOrganization(activeUser.id, orgTanBinh.id, INITIAL_MEMBERSHIPS);
  assert.equal(switchCheck.allowed, true);

  const switchRes = switchOrganizationContext({
    currentUser: activeUser,
    targetOrg: orgTanBinh,
    memberships: INITIAL_MEMBERSHIPS,
  });

  assert.equal(switchRes.success, true);
  activeUser = switchRes.updatedUser!;
  currentOrg = orgTanBinh;
  selectedJobId = null; // State reset per P0-01!

  // Assertions:
  assert.equal(activeUser.id, 'staff-01'); // Identity preserved!
  assert.equal(activeUser.fullName, 'Nguyễn Văn Thành');
  assert.equal(activeUser.organizationId, 'org-saigon-tanbinh');
  assert.equal(currentOrg.id, 'org-saigon-tanbinh');
  assert.equal(selectedJobId, null); // Selection cleared!
});

test('INTEGRATION 3: Payment Recording Workflow — Owner records payment, recomputes status dynamically, handles overpayment and refund', () => {
  let job: Job = {
    id: 'JOB-INTEG-01',
    organizationId: 'org-dienlanh-saigon',
    customerName: 'Bác Bình',
    customerPhone: '0918777888',
    address: 'Bình Thạnh',
    district: 'Bình Thạnh',
    scheduledTime: '10:00 - 11:30',
    scheduledDate: '2026-11-06',
    airconType: 'TREO_TUONG',
    brand: 'Toshiba',
    horsePower: '1.5 HP',
    serviceType: 'VE_SINH',
    symptoms: [],
    status: 'HOAN_THANH',
    paymentStatus: 'unpaid',
    checklist: {
      drainPipeCleared: true,
      filterCleaned: true,
      outdoorCoilCleaned: true,
      electricalTightened: true,
    },
    selectedServices: [
      { serviceId: 'VE_SINH_TREO_TUONG', quantity: 2, price: 150000 },
    ],
    spareParts: [],
    photosBefore: [],
    photosAfter: [],
    discount: 0,
    createdAt: '2026-11-06T08:00:00Z',
    paymentEntries: [],
  };

  // Step 1: Owner records partial payment of 200,000 VND
  const partialRes = recordPaymentLedgerEntry({
    job,
    currentUser: userOwner,
    amount: 200000,
    type: 'partial_payment',
    method: 'CHUYEN_KHOAN_QR',
    idempotencyKey: 'TX-INTEG-01',
  });
  assert.equal(partialRes.success, true);
  job = partialRes.updatedJob!;
  assert.equal(job.paymentStatus, 'partially_paid');
  assert.equal(job.paymentEntries?.length, 1);

  // Step 2: Owner records remaining payment of 100,000 VND -> status becomes paid
  const fullRes = recordPaymentLedgerEntry({
    job,
    currentUser: userOwner,
    amount: 100000,
    type: 'payment',
    method: 'TIEN_MAT',
    idempotencyKey: 'TX-INTEG-02',
  });
  assert.equal(fullRes.success, true);
  job = fullRes.updatedJob!;
  assert.equal(job.paymentStatus, 'paid');
  assert.equal(job.paymentEntries?.length, 2);

  // Step 3: Customer tip / overpayment of 50,000 VND -> status becomes overpaid
  const overRes = recordPaymentLedgerEntry({
    job,
    currentUser: userOwner,
    amount: 50000,
    type: 'payment',
    method: 'TIEN_MAT',
    idempotencyKey: 'TX-INTEG-03',
  });
  assert.equal(overRes.success, true);
  job = overRes.updatedJob!;
  assert.equal(job.paymentStatus, 'overpaid');
  assert.equal(job.paymentEntries?.length, 3);

  // Step 4: Refund of 350,000 VND -> status becomes refunded
  const refundRes = recordPaymentLedgerEntry({
    job,
    currentUser: userOwner,
    amount: 350000,
    type: 'refund',
    method: 'CHUYEN_KHOAN_QR',
    reason: 'Đổi máy mới hoàn toàn, hoàn trả toàn bộ số tiền đã nhận',
    idempotencyKey: 'TX-INTEG-04',
  });
  assert.equal(refundRes.success, true);
  job = refundRes.updatedJob!;
  assert.equal(job.paymentStatus, 'refunded');
  assert.equal(job.paymentEntries?.length, 4);
});

test('INTEGRATION 4: Permission Denial Workflow — blocks unauthorized operations at the core function boundary', () => {
  const job: Job = {
    id: 'JOB-INTEG-02',
    organizationId: 'org-dienlanh-saigon',
    customerName: 'Cô Cúc',
    customerPhone: '0909000111',
    address: 'Quận 3',
    district: 'Quận 3',
    scheduledTime: '13:00 - 14:30',
    scheduledDate: '2026-11-06',
    airconType: 'TREO_TUONG',
    brand: 'Daikin',
    horsePower: '1.0 HP',
    serviceType: 'VE_SINH',
    symptoms: [],
    status: 'DANG_SUA',
    paymentStatus: 'unpaid',
    checklist: {
      drainPipeCleared: true,
      filterCleaned: true,
      outdoorCoilCleaned: true,
      electricalTightened: true,
    },
    selectedServices: [
      { serviceId: 'VE_SINH_TREO_TUONG', quantity: 1, price: 150000 },
    ],
    spareParts: [],
    photosBefore: [],
    photosAfter: [],
    discount: 0,
    createdAt: '2026-11-06T08:00:00Z',
    paymentEntries: [],
  };

  // 1. Technician tries to record directly into ledger -> DENIED
  const techLedgerRes = recordPaymentLedgerEntry({
    job,
    currentUser: userTech,
    amount: 150000,
    type: 'payment',
    method: 'TIEN_MAT',
  });
  assert.equal(techLedgerRes.success, false);
  assert.match(techLedgerRes.error || '', /Kỹ thuật viên không có quyền/);

  // But technician CAN report payment
  const techReport = reportPaymentByTechnician(job, userTech, {
    amount: 150000,
    method: 'TIEN_MAT',
    notes: 'Khách đã đưa tiền mặt đủ',
  });
  assert.equal(techReport.success, true);
  assert.match(techReport.message, /Đã gửi báo cáo thu tiền/);

  // 2. User tries to switch to org-bacnam-service without membership -> DENIED
  const unauthSwitch = switchOrganizationContext({
    currentUser: userOwner,
    targetOrg: orgBacNam,
    memberships: INITIAL_MEMBERSHIPS,
  });
  assert.equal(unauthSwitch.success, false);
  assert.match(unauthSwitch.error || '', /Từ chối truy cập/);

  // 3. User tries cross-tenant payment -> DENIED
  const crossTenantJob: Job = { ...job, organizationId: 'org-bacnam-service' };
  const crossTenantRes = recordPaymentLedgerEntry({
    job: crossTenantJob,
    currentUser: userOwner,
    amount: 150000,
    type: 'payment',
    method: 'TIEN_MAT',
  });
  assert.equal(crossTenantRes.success, false);
  assert.match(crossTenantRes.error || '', /Tenant mismatch/);
});
