import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalPaid,
  computePaymentStatusFromLedger,
  canRecordPayment,
  validateVNDAmount,
  recordPaymentLedgerEntry,
  reportPaymentByTechnician,
} from './payment-ledger';
import { Job, PaymentLedgerEntry, StaffUser } from './types';

const mockOwner: StaffUser = {
  id: 'staff-01',
  fullName: 'Nguyễn Văn Thành',
  phone: '0903111222',
  email: 'thanh@sgx.vn',
  role: 'owner',
  organizationId: 'org-dienlanh-saigon',
  active: true,
};

const mockManager: StaffUser = {
  id: 'staff-02',
  fullName: 'Lê Hoàng Minh',
  phone: '0912333444',
  email: 'minh@sgx.vn',
  role: 'manager',
  organizationId: 'org-dienlanh-saigon',
  active: true,
};

const mockTech: StaffUser = {
  id: 'staff-03',
  fullName: 'Trần Văn Hùng',
  phone: '0938789123',
  email: 'hung@sgx.vn',
  role: 'technician',
  organizationId: 'org-dienlanh-saigon',
  active: true,
};

const createMockJob = (overrides?: Partial<Job>): Job => ({
  id: 'JOB-TEST-01',
  organizationId: 'org-dienlanh-saigon',
  customerName: 'Anh Nam',
  customerPhone: '0912345678',
  address: '123 Lê Lợi',
  district: 'Quận 1',
  scheduledTime: '08:30 - 10:00',
  scheduledDate: '2026-11-06',
  airconType: 'TREO_TUONG',
  brand: 'Daikin',
  horsePower: '1.5 HP',
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
  ...overrides,
});

test('calculateTotalPaid accurately sums entries and handles refunds', () => {
  const entries: PaymentLedgerEntry[] = [
    {
      id: 'e1',
      jobId: 'j1',
      amount: 150000,
      type: 'payment',
      method: 'TIEN_MAT',
      recordedBy: 'Owner',
      recordedAt: '2026-11-06T09:00:00Z',
    },
    {
      id: 'e2',
      jobId: 'j1',
      amount: 50000,
      type: 'refund',
      method: 'CHUYEN_KHOAN_QR',
      recordedBy: 'Owner',
      recordedAt: '2026-11-06T09:30:00Z',
      reason: 'Hủy 1 phần dịch vụ',
    },
  ];

  assert.equal(calculateTotalPaid(entries), 100000);
});

test('computePaymentStatusFromLedger computes all 5 statuses: unpaid, partially_paid, paid, overpaid, refunded', () => {
  const totalPayable = 200000;

  // 1. Unpaid
  assert.equal(computePaymentStatusFromLedger(totalPayable, []), 'unpaid');

  // 2. Partially paid
  const partialEntries: PaymentLedgerEntry[] = [
    {
      id: 'e1',
      jobId: 'j1',
      amount: 100000,
      type: 'partial_payment',
      method: 'TIEN_MAT',
      recordedBy: 'Manager',
      recordedAt: '2026-11-06T09:00:00Z',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(totalPayable, partialEntries), 'partially_paid');

  // 3. Paid
  const paidEntries: PaymentLedgerEntry[] = [
    ...partialEntries,
    {
      id: 'e2',
      jobId: 'j1',
      amount: 100000,
      type: 'payment',
      method: 'CHUYEN_KHOAN_QR',
      recordedBy: 'Manager',
      recordedAt: '2026-11-06T09:15:00Z',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(totalPayable, paidEntries), 'paid');

  // 4. Overpaid (P0-03 Requirement)
  const overpaidEntries: PaymentLedgerEntry[] = [
    ...paidEntries,
    {
      id: 'e3',
      jobId: 'j1',
      amount: 50000,
      type: 'payment',
      method: 'TIEN_MAT',
      recordedBy: 'Manager',
      recordedAt: '2026-11-06T09:20:00Z',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(totalPayable, overpaidEntries), 'overpaid');

  // 5. Refunded
  const refundEntries: PaymentLedgerEntry[] = [
    {
      id: 'e1',
      jobId: 'j1',
      amount: 200000,
      type: 'payment',
      method: 'TIEN_MAT',
      recordedBy: 'Owner',
      recordedAt: '2026-11-06T09:00:00Z',
    },
    {
      id: 'e2',
      jobId: 'j1',
      amount: 200000,
      type: 'refund',
      method: 'CHUYEN_KHOAN_QR',
      recordedBy: 'Owner',
      recordedAt: '2026-11-06T09:30:00Z',
      reason: 'Khách không hài lòng',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(totalPayable, refundEntries), 'refunded');
});

test('validateVNDAmount strictly enforces integer positive VND', () => {
  assert.equal(validateVNDAmount(150000).valid, true);
  assert.equal(validateVNDAmount(150000.5).valid, false); // No fractional cents
  assert.equal(validateVNDAmount(-50000).valid, false);  // No negative payments
  assert.equal(validateVNDAmount(0).valid, false);        // Must be > 0 for payments
  assert.equal(validateVNDAmount(NaN).valid, false);
});

test('canRecordPayment allows Owner and Manager, strictly blocks Technician from confirming ledger', () => {
  const job = createMockJob();

  assert.equal(canRecordPayment(mockOwner, job).allowed, true);
  assert.equal(canRecordPayment(mockManager, job).allowed, true);

  // Technician must be blocked per P0-02
  const techCheck = canRecordPayment(mockTech, job);
  assert.equal(techCheck.allowed, false);
  assert.match(techCheck.reason || '', /Kỹ thuật viên không có quyền tự xác nhận/);

  // Cross-tenant job blocked
  const crossJob = createMockJob({ organizationId: 'org-bacnam-service' });
  assert.equal(canRecordPayment(mockOwner, crossJob).allowed, false);

  // Cancelled job blocked
  const cancelledJob = createMockJob({ status: 'DA_HUY' });
  assert.equal(canRecordPayment(mockOwner, cancelledJob).allowed, false);
});

test('recordPaymentLedgerEntry successfully records full payment, partial payment, and overpayment', () => {
  const job = createMockJob(); // totalPayable: 150000

  // 1. Partial payment (100,000 VND)
  const res1 = recordPaymentLedgerEntry({
    job,
    currentUser: mockManager,
    amount: 100000,
    type: 'partial_payment',
    method: 'TIEN_MAT',
    idempotencyKey: 'IDEMP-01',
  });
  assert.equal(res1.success, true);
  assert.equal(res1.updatedJob?.paymentStatus, 'partially_paid');
  assert.equal(res1.updatedJob?.paymentEntries?.length, 1);

  // 2. Full payment (adds 50,000 VND -> total 150,000)
  const res2 = recordPaymentLedgerEntry({
    job: res1.updatedJob!,
    currentUser: mockManager,
    amount: 50000,
    type: 'payment',
    method: 'CHUYEN_KHOAN_QR',
    idempotencyKey: 'IDEMP-02',
  });
  assert.equal(res2.success, true);
  assert.equal(res2.updatedJob?.paymentStatus, 'paid');
  assert.equal(res2.updatedJob?.paymentEntries?.length, 2);

  // 3. Overpayment (adds extra 20,000 VND -> total 170,000 > 150,000)
  const res3 = recordPaymentLedgerEntry({
    job: res2.updatedJob!,
    currentUser: mockOwner,
    amount: 20000,
    type: 'payment',
    method: 'TIEN_MAT',
    idempotencyKey: 'IDEMP-03',
  });
  assert.equal(res3.success, true);
  assert.equal(res3.updatedJob?.paymentStatus, 'overpaid');
});

test('recordPaymentLedgerEntry rejects duplicate submission with same idempotencyKey', () => {
  const job = createMockJob();

  const res1 = recordPaymentLedgerEntry({
    job,
    currentUser: mockOwner,
    amount: 150000,
    type: 'payment',
    method: 'TIEN_MAT',
    idempotencyKey: 'UNIQUE-TX-999',
  });
  assert.equal(res1.success, true);

  const resDuplicate = recordPaymentLedgerEntry({
    job: res1.updatedJob!,
    currentUser: mockOwner,
    amount: 150000,
    type: 'payment',
    method: 'TIEN_MAT',
    idempotencyKey: 'UNIQUE-TX-999',
  });
  assert.equal(resDuplicate.success, false);
  assert.match(resDuplicate.error || '', /Giao dịch trùng lặp/);
});

test('recordPaymentLedgerEntry enforces refund constraints: mandatory reason and amount bound', () => {
  const job = createMockJob({
    paymentEntries: [
      {
        id: 'e1',
        jobId: 'JOB-TEST-01',
        amount: 150000,
        type: 'payment',
        method: 'TIEN_MAT',
        recordedBy: 'Owner',
        recordedAt: '2026-11-06T09:00:00Z',
      },
    ],
  });

  // 1. Missing reason
  const resMissingReason = recordPaymentLedgerEntry({
    job,
    currentUser: mockOwner,
    amount: 50000,
    type: 'refund',
    method: 'CHUYEN_KHOAN_QR',
  });
  assert.equal(resMissingReason.success, false);
  assert.match(resMissingReason.error || '', /Bắt buộc nhập lý do hoàn tiền/);

  // 2. Refund exceeding collected balance (200,000 > 150,000)
  const resExceeding = recordPaymentLedgerEntry({
    job,
    currentUser: mockOwner,
    amount: 200000,
    type: 'refund',
    method: 'CHUYEN_KHOAN_QR',
    reason: 'Đòi hoàn tiền nhiều hơn',
  });
  assert.equal(resExceeding.success, false);
  assert.match(resExceeding.error || '', /không được vượt quá số tiền đã thu/);

  // 3. Valid full refund
  const resValidRefund = recordPaymentLedgerEntry({
    job,
    currentUser: mockOwner,
    amount: 150000,
    type: 'refund',
    method: 'CHUYEN_KHOAN_QR',
    reason: 'Khách khiếu nại chất lượng dịch vụ',
  });
  assert.equal(resValidRefund.success, true);
  assert.equal(resValidRefund.updatedJob?.paymentStatus, 'refunded');
});

test('reportPaymentByTechnician records report note without confirming ledger', () => {
  const job = createMockJob({ assignedTechnicianId: 'staff-03' });

  const reportRes = reportPaymentByTechnician(job, mockTech, {
    amount: 150000,
    method: 'CHUYEN_KHOAN_QR',
    notes: 'Khách đã quét mã VietQR thành công',
  });

  assert.equal(reportRes.success, true);
  assert.match(reportRes.job.customerNotes || '', /KTV Trần Văn Hùng BÁO KHÁCH ĐÃ THANH TOÁN 150.000 ₫/);
  // Job paymentEntries remains untouched by tech report!
  assert.equal(reportRes.job.paymentEntries?.length || 0, 0);
  assert.equal(reportRes.job.paymentStatus, 'unpaid');
});
