import { PaymentLedgerEntry, PaymentStatus, PaymentTransactionType, StaffUser, Job } from './types';
import { calculateJobTotal } from './pricing';

/**
 * Validates whether an amount is a valid integer VND amount.
 * INVARIANT (P0-03):
 * - Must be an integer number (VND has no fractional cents).
 * - Finite and not NaN.
 * - Negative amounts are disallowed unless specifically permitted for adjustments.
 */
export const validateVNDAmount = (
  amount: unknown,
  options: { allowNegative?: boolean; requirePositive?: boolean } = { requirePositive: true }
): { valid: boolean; error?: string } => {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || Number.isNaN(amount)) {
    return { valid: false, error: 'Số tiền phải là một giá trị số hợp lệ.' };
  }

  if (!Number.isInteger(amount)) {
    return { valid: false, error: 'Số tiền VND phải là số nguyên (không chứa phần thập phân).' };
  }

  if (options.requirePositive && amount <= 0) {
    return { valid: false, error: 'Số tiền giao dịch phải là số nguyên dương lớn hơn 0 ₫.' };
  }

  if (!options.allowNegative && amount < 0) {
    return { valid: false, error: 'Số tiền không được âm.' };
  }

  return { valid: true };
};

/**
 * Calculates net total paid amount from payment ledger entries.
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
 * Computes payment status dynamically from the payment ledger (P0-03).
 * Distinct statuses:
 * - 'unpaid': totalPaid === 0 (and no refunds)
 * - 'partially_paid': 0 < totalPaid < totalPayable
 * - 'paid': totalPaid === totalPayable
 * - 'overpaid': totalPaid > totalPayable (Khách trả thừa)
 * - 'refunded': net balance <= 0 and there are refund records
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

  if (totalPaid === totalPayable) {
    return 'paid';
  }

  return 'overpaid';
};

/**
 * Validates whether the current staff user has permission to record or adjust
 * payment on the ledger (P0-02 Authorization).
 * INVARIANTS:
 * - Active user check.
 * - Cross-tenant protection.
 * - Cancelled job check.
 * - ONLY Owner / Manager can record/confirm payment into the ledger in UI v2.3.
 * - Technician CANNOT confirm ledger receipt (can only report payment).
 */
export const canRecordPayment = (
  currentUser: StaffUser,
  job?: Job
): { allowed: boolean; reason?: string } => {
  if (!currentUser || !currentUser.active) {
    return { allowed: false, reason: 'Tài khoản người dùng không hợp lệ hoặc đã bị vô hiệu hóa.' };
  }

  // Cross-tenant protection
  if (job && job.organizationId !== currentUser.organizationId) {
    return {
      allowed: false,
      reason: 'Không có quyền thao tác trên ca làm việc thuộc tổ chức khác (Tenant mismatch).',
    };
  }

  // Cancelled job protection
  if (job && job.status === 'DA_HUY') {
    return {
      allowed: false,
      reason: 'Không thể ghi nhận thanh toán cho ca làm việc đã bị hủy.',
    };
  }

  // Strict P0-02 Requirement: ONLY Owner / Manager can confirm receipt on the ledger
  if (currentUser.role === 'owner' || currentUser.role === 'manager') {
    return { allowed: true };
  }

  if (currentUser.role === 'technician') {
    return {
      allowed: false,
      reason:
        'Kỹ thuật viên không có quyền tự xác nhận khoản thu vào sổ cái. Kỹ thuật viên chỉ có thể gửi báo cáo đã thanh toán cho Quản lý / Chủ cơ sở duyệt.',
    };
  }

  return { allowed: false, reason: 'Vai trò người dùng không có quyền ghi nhận thanh toán.' };
};

export interface RecordPaymentParams {
  job: Job;
  currentUser: StaffUser;
  amount: number;
  type: PaymentTransactionType;
  method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR';
  reason?: string;
  transactionRef?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface RecordPaymentResult {
  success: boolean;
  error?: string;
  updatedJob?: Job;
  newEntry?: PaymentLedgerEntry;
}

/**
 * Records an append-only transaction onto the job payment ledger (P0-02 & P0-03).
 * Enforces:
 * - RBAC permission check (Owner/Manager only).
 * - Integer VND validation.
 * - Mandatory reason for refunds and adjustments.
 * - Balance bounds (refund cannot exceed collected balance; adjustment cannot create negative balance).
 * - Duplicate submission / idempotency check.
 * - Dynamic payment status recomputation (including overpaid).
 */
export const recordPaymentLedgerEntry = (
  params: RecordPaymentParams
): RecordPaymentResult => {
  const { job, currentUser, amount, type, method, reason, transactionRef, idempotencyKey, notes } = params;

  // 1. Authorization check
  const perm = canRecordPayment(currentUser, job);
  if (!perm.allowed) {
    return { success: false, error: perm.reason || 'Từ chối quyền ghi sổ cái thanh toán.' };
  }

  const existingEntries = job.paymentEntries || [];
  const currentTotalPaid = calculateTotalPaid(existingEntries);

  // 2. Duplicate submission / Idempotency check
  if (idempotencyKey) {
    const existingKey = existingEntries.find((e) => e.idempotencyKey === idempotencyKey);
    if (existingKey) {
      return {
        success: false,
        error: 'Giao dịch trùng lặp: Bút toán này đã được ghi nhận trước đó (Idempotency key match).',
      };
    }
  }

  // Rapid duplicate submission prevention (identical amount, method, type recorded within 3 seconds)
  const now = Date.now();
  const recentDuplicate = existingEntries.find((e) => {
    if (e.amount === amount && e.method === method && e.type === type) {
      const entryTime = new Date(e.recordedAt).getTime();
      return now - entryTime < 3000;
    }
    return false;
  });

  if (recentDuplicate) {
    return {
      success: false,
      error: 'Cảnh báo trùng lặp: Giao dịch tương tự vừa được tạo cách đây vài giây. Vui lòng kiểm tra lại sổ cái.',
    };
  }

  // 3. Amount & Bounds validation
  if (type === 'adjustment') {
    const validCheck = validateVNDAmount(amount, { allowNegative: true, requirePositive: false });
    if (!validCheck.valid) {
      return { success: false, error: validCheck.error };
    }
    if (amount === 0) {
      return { success: false, error: 'Số tiền điều chỉnh phải khác 0 ₫.' };
    }
    if (currentTotalPaid + amount < 0) {
      return {
        success: false,
        error: 'Điều chỉnh không hợp lệ: Số dư sổ cái sau điều chỉnh không được âm.',
      };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Bắt buộc nhập lý do điều chỉnh sổ cái.' };
    }
  } else if (type === 'refund') {
    const validCheck = validateVNDAmount(amount, { requirePositive: true });
    if (!validCheck.valid) {
      return { success: false, error: validCheck.error };
    }
    if (currentTotalPaid <= 0) {
      return { success: false, error: 'Không thể hoàn tiền khi chưa có khoản thu nào trên sổ cái.' };
    }
    if (amount > currentTotalPaid) {
      return {
        success: false,
        error: `Số tiền hoàn trả (${amount.toLocaleString('vi-VN')} ₫) không được vượt quá số tiền đã thu (${currentTotalPaid.toLocaleString('vi-VN')} ₫).`,
      };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Bắt buộc nhập lý do hoàn tiền.' };
    }
  } else {
    // Payment or partial_payment
    const validCheck = validateVNDAmount(amount, { requirePositive: true });
    if (!validCheck.valid) {
      return { success: false, error: validCheck.error };
    }
  }

  // 4. Create new append-only entry
  const newEntry: PaymentLedgerEntry = {
    id: `LEDGER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    jobId: job.id,
    amount,
    type,
    method,
    transactionRef: transactionRef || undefined,
    idempotencyKey: idempotencyKey || undefined,
    recordedBy: `${currentUser.fullName} (${currentUser.role === 'owner' ? 'Chủ cơ sở' : 'Quản lý'})`,
    recordedAt: new Date().toISOString(),
    reason: reason?.trim() || undefined,
    notes: notes?.trim() || undefined,
  };

  const updatedEntries = [...existingEntries, newEntry];
  const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
  const newStatus = computePaymentStatusFromLedger(pricing.totalPayable, updatedEntries);

  const updatedJob: Job = {
    ...job,
    paymentEntries: updatedEntries,
    paymentStatus: newStatus,
  };

  return {
    success: true,
    newEntry,
    updatedJob,
  };
};

/**
 * Allows a Technician to report that the customer has made a payment (P0-02).
 * Does NOT append to the payment ledger directly; informs Manager/Owner.
 */
export const reportPaymentByTechnician = (
  job: Job,
  technician: StaffUser,
  report: {
    amount: number;
    method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR';
    notes?: string;
  }
): { success: boolean; job: Job; message: string; error?: string } => {
  if (technician.role !== 'technician') {
    return {
      success: false,
      job,
      message: '',
      error: 'Chức năng báo cáo này dành riêng cho Kỹ thuật viên.',
    };
  }

  if (job.organizationId !== technician.organizationId) {
    return {
      success: false,
      job,
      message: '',
      error: 'Không thể báo cáo cho ca làm việc thuộc tổ chức khác.',
    };
  }

  const validAmount = validateVNDAmount(report.amount, { requirePositive: true });
  if (!validAmount.valid) {
    return { success: false, job, message: '', error: validAmount.error };
  }

  const reportNote = `[KTV ${technician.fullName} BÁO KHÁCH ĐÃ THANH TOÁN ${report.amount.toLocaleString('vi-VN')} ₫ qua ${report.method === 'CHUYEN_KHOAN_QR' ? 'VietQR' : 'Tiền mặt'}${report.notes ? ` - ${report.notes}` : ''}]`;

  const updatedJob: Job = {
    ...job,
    customerNotes: job.customerNotes ? `${job.customerNotes}\n${reportNote}` : reportNote,
  };

  return {
    success: true,
    job: updatedJob,
    message: `Đã gửi báo cáo thu tiền (${report.amount.toLocaleString('vi-VN')} ₫). Quản lý sẽ xác nhận vào sổ cái chính thức.`,
  };
};
