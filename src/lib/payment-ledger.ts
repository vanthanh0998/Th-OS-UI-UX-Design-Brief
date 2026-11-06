import { PaymentLedgerEntry, PaymentStatus, StaffUser, Job } from './types';

/**
 * Calculates total net paid amount from payment ledger entries.
 * Positive for payment/partial_payment/adjustment, negative for refund.
 */
export const calculateTotalPaid = (entries?: PaymentLedgerEntry[]): number => {
  if (!entries || entries.length === 0) return 0;
  return entries.reduce((acc, entry) => {
    if (entry.type === 'refund') {
      return acc - Math.abs(entry.amount);
    }
    return acc + (entry.amount || 0);
  }, 0);
};

/**
 * Computes payment status dynamically from the payment ledger.
 * No hardcoded 'paid' statuses.
 */
export const computePaymentStatusFromLedger = (
  totalPayable: number,
  entries?: PaymentLedgerEntry[]
): PaymentStatus => {
  if (!entries || entries.length === 0) {
    return 'unpaid';
  }

  const totalPaid = calculateTotalPaid(entries);
  const hasRefunds = entries.some((e) => e.type === 'refund');

  if (totalPaid <= 0) {
    return hasRefunds ? 'refunded' : 'unpaid';
  }

  if (totalPaid < totalPayable) {
    return 'partially_paid';
  }

  return 'paid';
};

/**
 * Validates whether the current staff user has permission to record or adjust
 * payment for a given job.
 */
export const canRecordPayment = (
  currentUser: StaffUser,
  job?: Job
): { allowed: boolean; reason?: string } => {
  if (!currentUser.active) {
    return { allowed: false, reason: 'Tài khoản người dùng đã bị vô hiệu hóa.' };
  }

  // Cross-tenant protection
  if (job && job.organizationId !== currentUser.organizationId) {
    return {
      allowed: false,
      reason: 'Không có quyền thao tác trên ca làm việc thuộc tổ chức khác (Tenant mismatch).',
    };
  }

  // Owners and Managers have full ledger recording rights
  if (currentUser.role === 'owner' || currentUser.role === 'manager') {
    return { allowed: true };
  }

  // Technicians can only record payments for jobs specifically assigned to them
  if (currentUser.role === 'technician') {
    if (job && job.assignedTechnicianId === currentUser.id) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Kỹ thuật viên chỉ có quyền thu tiền cho ca làm việc được phân công cho mình.',
    };
  }

  return { allowed: false, reason: 'Vai trò người dùng không có quyền ghi nhận thanh toán.' };
};
