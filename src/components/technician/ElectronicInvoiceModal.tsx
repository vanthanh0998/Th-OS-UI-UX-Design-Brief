import React, { useState } from 'react';
import {
  CheckCircle2,
  DollarSign,
  AlertCircle,
  History,
  Send,
  Lock,
} from 'lucide-react';
import { Job, StaffUser, PaymentTransactionType } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import {
  calculateTotalPaid,
  computePaymentStatusFromLedger,
  canRecordPayment,
  validateVNDAmount,
} from '../../lib/payment-ledger';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { VietQRCode } from '../ui/VietQRCode';

interface ElectronicInvoiceModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: StaffUser;
  onConfirmPayment: (
    jobId: string,
    amount: number,
    method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR',
    type: PaymentTransactionType,
    reason?: string,
    notes?: string,
    idempotencyKey?: string
  ) => { success: boolean; error?: string };
  onReportPaymentByTech?: (
    jobId: string,
    amount: number,
    method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR',
    notes?: string
  ) => { success: boolean; message: string; error?: string };
}

export const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({
  job,
  isOpen,
  onClose,
  currentUser,
  onConfirmPayment,
  onReportPaymentByTech,
}) => {
  if (!job) return null;

  const [paymentType, setPaymentType] = useState<'CHUYEN_KHOAN_QR' | 'TIEN_MAT'>('CHUYEN_KHOAN_QR');
  const [actionType, setActionType] = useState<'FULL' | 'PARTIAL' | 'REFUND'>('FULL');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
  const totalPaid = calculateTotalPaid(job.paymentEntries);
  const remainingAmount = Math.max(0, pricing.totalPayable - totalPaid);
  const currentStatus = computePaymentStatusFromLedger(pricing.totalPayable, job.paymentEntries);

  // RBAC Permission Check (P0-02: Owner/Manager only)
  const perm = canRecordPayment(currentUser, job);
  const isTechnician = currentUser.role === 'technician';

  // Amount to be transacted based on selected mode
  const getTransactionAmount = (): number => {
    if (actionType === 'FULL') return remainingAmount;
    const parsed = parseInt(customAmount.replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleComplete = () => {
    setErrorMessage('');
    setSuccessNotice('');

    if (!perm.allowed) {
      setErrorMessage(perm.reason || 'Bạn không có quyền thực hiện thao tác thu tiền này.');
      return;
    }

    const amount = getTransactionAmount();
    const validCheck = validateVNDAmount(amount, { requirePositive: true });
    if (!validCheck.valid) {
      setErrorMessage(validCheck.error || 'Số tiền giao dịch không hợp lệ.');
      return;
    }

    if (actionType === 'PARTIAL' && amount > remainingAmount) {
      setErrorMessage(
        `Số tiền thu một phần (${formatVND(amount)}) không được vượt quá số tiền còn lại (${formatVND(remainingAmount)}).`
      );
      return;
    }

    if (actionType === 'REFUND') {
      if (!reason.trim()) {
        setErrorMessage('Bắt buộc nhập lý do hoàn trả tiền cho khách hàng.');
        return;
      }
      if (amount > totalPaid) {
        setErrorMessage(`Số tiền hoàn trả không được vượt quá số tiền đã thu (${formatVND(totalPaid)}).`);
        return;
      }
    }

    const txType: PaymentTransactionType =
      actionType === 'REFUND'
        ? 'refund'
        : actionType === 'PARTIAL'
        ? 'partial_payment'
        : 'payment';

    const idempotencyKey = `PAY-${job.id}-${actionType}-${amount}-${Date.now()}`;

    const res = onConfirmPayment(
      job.id,
      amount,
      paymentType,
      txType,
      reason.trim() || undefined,
      notes.trim() || undefined,
      idempotencyKey
    );

    if (res && !res.success) {
      setErrorMessage(res.error || 'Có lỗi xảy ra khi ghi nhận thanh toán.');
      return;
    }

    setSuccessNotice('Đã ghi nhận bút toán vào sổ cái thành công!');
    setCustomAmount('');
    setReason('');
    setNotes('');
  };

  const handleTechReport = () => {
    setErrorMessage('');
    setSuccessNotice('');

    const amount = getTransactionAmount() || remainingAmount || pricing.totalPayable;
    const validCheck = validateVNDAmount(amount, { requirePositive: true });
    if (!validCheck.valid) {
      setErrorMessage(validCheck.error || 'Số tiền báo cáo không hợp lệ.');
      return;
    }

    if (onReportPaymentByTech) {
      const res = onReportPaymentByTech(job.id, amount, paymentType, notes.trim() || undefined);
      if (res.success) {
        setSuccessNotice(res.message);
        setNotes('');
      } else {
        setErrorMessage(res.error || 'Không thể gửi báo cáo thanh toán.');
      }
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Đã thu đủ
          </span>
        );
      case 'overpaid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Khách trả thừa (+{formatVND(totalPaid - pricing.totalPayable)})
          </span>
        );
      case 'partially_paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Thu một phần
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Đã hoàn tiền
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Chưa thu tiền
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sổ Cái Thu Tiền & Hóa Đơn Dịch Vụ"
      subtitle={`Ca làm việc #${job.id} • Khách hàng: ${job.customerName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Mock Ledger Disclaimer (Transparency) */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Mô phỏng Sổ cái thanh toán (Mock Ledger):</span> Dữ liệu ghi sổ được cập nhật trực tiếp vào hồ sơ ca làm việc phía client, chưa qua cổng thanh toán ngân hàng hoặc backend production có RLS.
          </div>
        </div>

        {/* Role Authorization Banner */}
        {isTechnician ? (
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-start gap-2 text-xs text-sky-900">
            <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Phân quyền Kỹ thuật viên (P0-02):</span> Kỹ thuật viên có thể báo cáo khách đã thanh toán, nhưng không có quyền tự ghi nhận hoặc xác nhận khoản thu vào sổ cái. Quản lý hoặc Chủ cơ sở sẽ xác nhận bút toán chính thức.
            </div>
          </div>
        ) : !perm.allowed ? (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2 text-xs text-rose-900 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>Từ chối quyền: {perm.reason}</span>
          </div>
        ) : null}

        {/* Balance & Status Summary Card */}
        <div className="bg-[#0a1e3f] text-white p-4 sm:p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-300">
              Tổng giá trị dịch vụ: <strong className="text-white text-sm">{formatVND(pricing.totalPayable)}</strong>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
            <div>
              <span className="text-slate-400">Đã ghi nhận thu:</span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {formatVND(totalPaid)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400">
                {currentStatus === 'overpaid' ? 'Số tiền thu thừa:' : 'Số tiền còn lại:'}
              </span>
              <div
                className={`text-base font-bold mt-0.5 ${
                  currentStatus === 'overpaid' ? 'text-blue-300' : 'text-amber-300'
                }`}
              >
                {currentStatus === 'overpaid'
                  ? formatVND(totalPaid - pricing.totalPayable)
                  : formatVND(remainingAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Type Selector (Only for Owner/Manager) */}
        {!isTechnician && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Chọn hình thức ghi sổ:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionType('FULL');
                  setErrorMessage('');
                }}
                className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                  actionType === 'FULL'
                    ? 'border-[#0d9488] bg-teal-50 text-[#0d9488]'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Thu đủ ({formatVND(remainingAmount)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('PARTIAL');
                  setErrorMessage('');
                }}
                className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                  actionType === 'PARTIAL'
                    ? 'border-[#0d9488] bg-teal-50 text-[#0d9488]'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Thu một phần
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionType('REFUND');
                  setErrorMessage('');
                }}
                className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                  actionType === 'REFUND'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Hoàn tiền
              </button>
            </div>
          </div>
        )}

        {/* Custom Amount Input for Partial or Refund */}
        {!isTechnician && (actionType === 'PARTIAL' || actionType === 'REFUND') && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              {actionType === 'PARTIAL' ? 'Nhập số tiền thu một phần (VND):' : 'Nhập số tiền hoàn trả khách (VND):'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Ví dụ: 100.000"
                className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:outline-none focus:border-teal-600"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold">
                VND
              </span>
            </div>
          </div>
        )}

        {/* Mandatory Reason Input for Refund */}
        {!isTechnician && actionType === 'REFUND' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-rose-700 block">
              Lý do hoàn tiền (Bắt buộc theo P0-03):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Khách hủy dịch vụ vệ sinh máy thứ 2"
              className="w-full h-10 px-3 rounded-xl border border-rose-300 bg-rose-50/40 text-xs text-slate-900 focus:outline-none focus:border-rose-600 font-medium"
            />
          </div>
        )}

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Phương thức thanh toán:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType('CHUYEN_KHOAN_QR')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                paymentType === 'CHUYEN_KHOAN_QR'
                  ? 'border-[#0d9488] bg-teal-50 text-[#0d9488]'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              Chuyển khoản VietQR
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('TIEN_MAT')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                paymentType === 'TIEN_MAT'
                  ? 'border-[#0d9488] bg-teal-50 text-[#0d9488]'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              Tiền mặt
            </button>
          </div>
        </div>

        {/* VietQR or Cash Display */}
        {paymentType === 'CHUYEN_KHOAN_QR' ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
            <VietQRCode
              amount={getTransactionAmount() || remainingAmount || 150000}
              orderId={job.id}
              accountName="CONG TY DIEN LANH"
              accountNumber="0938 789 123"
              bankName="Vietcombank"
            />
            <p className="text-xs font-medium text-slate-600 mt-2">
              Quét VietQR qua app ngân hàng để chuyển khoản chính xác số tiền
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
            <div className="font-bold text-slate-900 text-sm">
              Xác nhận thu tiền mặt tại chỗ
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm đếm đúng số tiền{' '}
              <strong className="text-slate-800">
                {formatVND(getTransactionAmount() || remainingAmount)}
              </strong>{' '}
              từ khách hàng.
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Ghi chú giao dịch:
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Khách thanh toán tại chung cư Masteri"
            className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}
        {successNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Action Button: Technician vs Owner/Manager */}
        {isTechnician ? (
          <Button
            variant="teal"
            size="lg"
            fullWidth
            onClick={handleTechReport}
          >
            <Send className="w-4 h-4 mr-1.5" />
            Báo khách đã thanh toán ({formatVND(getTransactionAmount() || remainingAmount)})
          </Button>
        ) : (
          <Button
            variant={actionType === 'REFUND' ? 'danger' : 'success'}
            size="lg"
            fullWidth
            disabled={!perm.allowed || (actionType === 'FULL' && remainingAmount === 0)}
            onClick={handleComplete}
          >
            <CheckCircle2 className="w-5 h-5 mr-1" />
            {actionType === 'REFUND'
              ? `Xác nhận hoàn trả (${formatVND(getTransactionAmount())})`
              : `Ghi nhận vào sổ cái (${formatVND(getTransactionAmount() || remainingAmount)})`}
          </Button>
        )}

        {/* Transaction History in Ledger (Append-Only) */}
        {job.paymentEntries && job.paymentEntries.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <History className="w-3.5 h-3.5 text-teal-600" />
              <span>Lịch sử sổ cái thu tiền ({job.paymentEntries.length} giao dịch)</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {job.paymentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      {entry.type === 'refund'
                        ? 'Hoàn tiền'
                        : entry.type === 'partial_payment'
                        ? 'Thu một phần'
                        : entry.type === 'adjustment'
                        ? 'Điều chỉnh'
                        : 'Thu tiền'}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({entry.method === 'CHUYEN_KHOAN_QR' ? 'VietQR' : 'Tiền mặt'}) • bởi {entry.recordedBy}
                    </span>
                    {entry.reason && (
                      <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                        Lý do: {entry.reason}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        &ldquo;{entry.notes}&rdquo;
                      </div>
                    )}
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      entry.type === 'refund' ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {entry.type === 'refund' ? '-' : '+'}
                    {formatVND(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
