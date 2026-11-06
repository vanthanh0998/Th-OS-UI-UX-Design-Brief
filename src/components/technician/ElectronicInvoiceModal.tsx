import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  QrCode,
  DollarSign,
  AlertCircle,
  RotateCcw,
  Receipt,
  Clock,
  History,
} from 'lucide-react';
import { Job, StaffUser, PaymentTransactionType } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import {
  calculateTotalPaid,
  computePaymentStatusFromLedger,
  canRecordPayment,
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
    type?: PaymentTransactionType,
    notes?: string
  ) => void;
}

export const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({
  job,
  isOpen,
  onClose,
  currentUser,
  onConfirmPayment,
}) => {
  if (!job) return null;

  const [paymentType, setPaymentType] = useState<'CHUYEN_KHOAN_QR' | 'TIEN_MAT'>('CHUYEN_KHOAN_QR');
  const [actionType, setActionType] = useState<'FULL' | 'PARTIAL' | 'REFUND'>('FULL');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
  const totalPaid = calculateTotalPaid(job.paymentEntries);
  const remainingAmount = Math.max(0, pricing.totalPayable - totalPaid);
  const currentStatus = computePaymentStatusFromLedger(pricing.totalPayable, job.paymentEntries);

  // RBAC Permission Check
  const perm = canRecordPayment(currentUser, job);

  // Amount to be transacted based on selected mode
  const getTransactionAmount = (): number => {
    if (actionType === 'FULL') return remainingAmount;
    const parsed = parseInt(customAmount.replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleComplete = () => {
    setErrorMessage('');

    if (!perm.allowed) {
      setErrorMessage(perm.reason || 'Bạn không có quyền thực hiện thao tác thu tiền này.');
      return;
    }

    const amount = getTransactionAmount();
    if (amount <= 0) {
      setErrorMessage('Số tiền giao dịch phải lớn hơn 0 ₫.');
      return;
    }

    if (actionType === 'PARTIAL' && amount > remainingAmount) {
      setErrorMessage(`Số tiền thu một phần không được vượt quá số tiền còn lại (${formatVND(remainingAmount)}).`);
      return;
    }

    if (actionType === 'REFUND' && amount > totalPaid) {
      setErrorMessage(`Số tiền hoàn trả không được vượt quá số tiền đã thu (${formatVND(totalPaid)}).`);
      return;
    }

    const txType: PaymentTransactionType =
      actionType === 'REFUND'
        ? 'refund'
        : actionType === 'PARTIAL'
        ? 'partial_payment'
        : 'payment';

    onConfirmPayment(job.id, amount, paymentType, txType, notes.trim() || undefined);
    setCustomAmount('');
    setNotes('');
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'paid':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã thu đủ</span>;
      case 'partially_paid':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Thu một phần</span>;
      case 'refunded':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Đã hoàn tiền</span>;
      case 'unpaid':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Chưa thu tiền</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sổ Cái Thu Tiền & Hóa Đơn Dịch Vụ"
      subtitle={`Ghi nhận thanh toán cho ca #${job.id} • Khách: ${job.customerName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Mock Ledger Disclaimer (Transparency) */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Mô phỏng Sổ cái thanh toán (Mock Ledger):</span> Dữ liệu ghi sổ được cập nhật trực tiếp vào hồ sơ ca làm việc phía client, chưa qua cổng kết nối ngân hàng/backend an toàn.
          </div>
        </div>

        {/* Role Permission Warning if Unauthorized */}
        {!perm.allowed && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-2 text-xs text-rose-900 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>Chặn thao tác: {perm.reason}</span>
          </div>
        )}

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
              <span className="text-slate-400">Số tiền còn lại:</span>
              <div className="text-base font-bold text-amber-300 mt-0.5">
                {formatVND(remainingAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Type Selector */}
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
              Thu đủ số còn lại
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

        {/* Custom Amount Input for Partial or Refund */}
        {(actionType === 'PARTIAL' || actionType === 'REFUND') && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              {actionType === 'PARTIAL' ? 'Nhập số tiền thu một phần:' : 'Nhập số tiền hoàn trả khách:'}
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

        {/* Dynamic VietQR or Cash UI */}
        {paymentType === 'CHUYEN_KHOAN_QR' ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
            <VietQRCode
              amount={getTransactionAmount() || remainingAmount || 150000}
              orderId={job.id}
              accountName="TRAN VAN HUNG"
              accountNumber="0938 789 123"
              bankName="Vietcombank"
            />
            <p className="text-xs font-medium text-slate-600 mt-2">
              Quét VietQR qua ứng dụng ngân hàng để chuyển khoản đúng số tiền
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
              <strong className="text-slate-800">{formatVND(getTransactionAmount() || remainingAmount)}</strong>{' '}
              từ khách hàng trước khi lưu sổ.
            </p>
          </div>
        )}

        {/* Optional Notes */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Ghi chú giao dịch (tùy chọn):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Khách thanh toán trước 50%, hẹn mai trả nốt"
            className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
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
                      {entry.type === 'refund' ? 'Hoàn tiền' : entry.type === 'partial_payment' ? 'Thu một phần' : 'Thu tiền'}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({entry.method === 'CHUYEN_KHOAN_QR' ? 'VietQR' : 'Tiền mặt'}) • bởi {entry.recordedBy}
                    </span>
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
