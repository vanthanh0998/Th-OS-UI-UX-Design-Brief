import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalPaid,
  computePaymentStatusFromLedger,
  canRecordPayment,
} from './payment-ledger';
import { Job, PaymentLedgerEntry, StaffUser } from './types';

test('calculateTotalPaid accurately sums entries and handles refunds', () => {
  const entries: PaymentLedgerEntry[] = [
    {
      id: 'L1',
      jobId: 'J1',
      amount: 100000,
      method: 'TIEN_MAT',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T00:00:00Z',
    },
    {
      id: 'L2',
      jobId: 'J1',
      amount: 50000,
      type: 'partial_payment',
      method: 'CHUYEN_KHOAN_QR',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T01:00:00Z',
    },
    {
      id: 'L3',
      jobId: 'J1',
      amount: 30000,
      type: 'refund',
      method: 'TIEN_MAT',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T02:00:00Z',
    },
  ];

  const total = calculateTotalPaid(entries);
  assert.equal(total, 120000); // 100k + 50k - 30k
});

test('computePaymentStatusFromLedger returns unpaid when no entries exist', () => {
  assert.equal(computePaymentStatusFromLedger(150000, []), 'unpaid');
  assert.equal(computePaymentStatusFromLedger(150000, undefined), 'unpaid');
});

test('computePaymentStatusFromLedger returns partially_paid when amount < totalPayable', () => {
  const entries: PaymentLedgerEntry[] = [
    {
      id: 'L1',
      jobId: 'J1',
      amount: 70000,
      method: 'TIEN_MAT',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T00:00:00Z',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(150000, entries), 'partially_paid');
});

test('computePaymentStatusFromLedger returns paid when amount >= totalPayable', () => {
  const entries: PaymentLedgerEntry[] = [
    {
      id: 'L1',
      jobId: 'J1',
      amount: 150000,
      method: 'TIEN_MAT',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T00:00:00Z',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(150000, entries), 'paid');

  // Overpayment also counts as paid
  const overpaid: PaymentLedgerEntry[] = [
    {
      id: 'L2',
      jobId: 'J1',
      amount: 200000,
      method: 'CHUYEN_KHOAN_QR',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T00:00:00Z',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(150000, overpaid), 'paid');
});

test('computePaymentStatusFromLedger returns refunded when net balance is zero with refund transactions', () => {
  const entries: PaymentLedgerEntry[] = [
    {
      id: 'L1',
      jobId: 'J1',
      amount: 150000,
      method: 'TIEN_MAT',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T00:00:00Z',
    },
    {
      id: 'L2',
      jobId: 'J1',
      amount: 150000,
      type: 'refund',
      method: 'TIEN_MAT',
      recordedBy: 'Admin',
      recordedAt: '2026-11-06T01:00:00Z',
    },
  ];
  assert.equal(computePaymentStatusFromLedger(150000, entries), 'refunded');
});

test('canRecordPayment blocks unauthorized roles and cross-tenant operations', () => {
  const owner: StaffUser = {
    id: 'u1',
    fullName: 'Owner',
    email: 'owner@test.vn',
    phone: '0901',
    role: 'owner',
    organizationId: 'org-sgx',
    active: true,
  };

  const manager: StaffUser = {
    id: 'u2',
    fullName: 'Manager',
    email: 'mgr@test.vn',
    phone: '0902',
    role: 'manager',
    organizationId: 'org-sgx',
    active: true,
  };

  const assignedTech: StaffUser = {
    id: 'tech-1',
    fullName: 'Tech 1',
    email: 'tech1@test.vn',
    phone: '0903',
    role: 'technician',
    organizationId: 'org-sgx',
    active: true,
  };

  const unassignedTech: StaffUser = {
    id: 'tech-2',
    fullName: 'Tech 2',
    email: 'tech2@test.vn',
    phone: '0904',
    role: 'technician',
    organizationId: 'org-sgx',
    active: true,
  };

  const inactiveUser: StaffUser = {
    ...owner,
    active: false,
  };

  const mockJob: Partial<Job> = {
    id: 'JOB-01',
    organizationId: 'org-sgx',
    assignedTechnicianId: 'tech-1',
  };

  const crossTenantJob: Partial<Job> = {
    id: 'JOB-02',
    organizationId: 'org-hn',
    assignedTechnicianId: 'tech-1',
  };

  // Owner & Manager can record
  assert.equal(canRecordPayment(owner, mockJob as Job).allowed, true);
  assert.equal(canRecordPayment(manager, mockJob as Job).allowed, true);

  // Assigned tech can record
  assert.equal(canRecordPayment(assignedTech, mockJob as Job).allowed, true);

  // Unassigned tech is blocked
  const unassignedResult = canRecordPayment(unassignedTech, mockJob as Job);
  assert.equal(unassignedResult.allowed, false);
  assert.match(unassignedResult.reason || '', /phân công/);

  // Inactive user is blocked
  assert.equal(canRecordPayment(inactiveUser, mockJob as Job).allowed, false);

  // Cross-tenant job is blocked even for owner
  const crossResult = canRecordPayment(owner, crossTenantJob as Job);
  assert.equal(crossResult.allowed, false);
  assert.match(crossResult.reason || '', /Tenant/);
});
