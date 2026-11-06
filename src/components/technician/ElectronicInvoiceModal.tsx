import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  QrCode,
  DollarSign,
  Share2,
  Printer,
  Sparkles,
  Phone,
  Calendar,
} from 'lucide-react';
import { Job } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

import { VietQRCode } from '../ui/VietQRCode';

interface ElectronicInvoiceModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (jobId: string, method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR') => void;
}

export const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({
  job,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  if (!job) return null;

  const [paymentType, setPaymentType] = useState<'CHUYEN_KHOAN_QR' | 'TIEN_MAT'>('CHUYEN_KHOAN_QR');
  const [isPaidSuccess, setIsPaidSuccess] = useState(job.paymentStatus === 'paid');

  const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);

  // Tạo URL VietQR chuẩn
  const qrUrl = `https://api.vietqr.io/image/970436-0938789123-compact2.png?amount=${pricing.totalPayable}&addInfo=${encodeURIComponent(
    `ThoOS ${job.id}`
  )}&accountName=${encodeURIComponent('TRAN VAN HUNG')}`;

  const handleComplete = () => {
    onConfirmPayment(job.id, paymentType);
    setIsPaidSuccess(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sổ Cái Thu Tiền (Payment Ledger - DEC-03)"
      subtitle={`Ghi nhận phiếu thu cho ca #${job.id} • Trạng thái công việc: Đã hoàn tất`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Receipt Header Badge */}
        <div className="bg-[#0a1e3f] text-white p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">
              ThợOS Certified Guarantee
            </div>
            <div className="text-base font-black text-white mt-0.5">
              Hóa Đơn Dịch Vụ Máy Lạnh
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Thợ: {job.technicianName}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Itemized Breakdown */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs">
          <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex justify-between">
            <span>Khách hàng: {job.customerName}</span>
            <span>{job.customerPhone}</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Thiết bị: {job.brand} {job.horsePower}</span>
              <span>1 bộ</span>
            </div>

            {job.selectedServices.map((s, idx) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span>Dịch vụ kỹ thuật ({s.quantity}x)</span>
                <span>{formatVND(s.price * s.quantity)}</span>
              </div>
            ))}

            {job.spareParts.map((p, idx) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span>
                  {p.name} (BH {p.warrantyMonths}T)
                </span>
                <span>{formatVND(p.unitPrice * p.quantity)}</span>
              </div>
            ))}

            {pricing.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Chiết khấu / Ưu đãi:</span>
                <span>-{formatVND(pricing.discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm font-black text-slate-900">
            <span>Tổng số tiền thu:</span>
            <span className="text-lg text-[#0d9488] font-black">
              {formatVND(pricing.totalPayable)}
            </span>
          </div>
        </div>

        {/* Payment QR Code for Instant Scanning */}
        <div className="bg-white border-2 border-dashed border-teal-200 rounded-2xl p-4 text-center">
          <div className="flex justify-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setPaymentType('CHUYEN_KHOAN_QR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                paymentType === 'CHUYEN_KHOAN_QR'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Quét mã QR Ngân Hàng
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('TIEN_MAT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                paymentType === 'TIEN_MAT'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Thu tiền mặt
            </button>
          </div>

          {paymentType === 'CHUYEN_KHOAN_QR' ? (
            <div className="flex flex-col items-center">
              <VietQRCode
                amount={pricing.totalPayable}
                orderId={job.id}
                accountName="TRAN VAN HUNG"
                accountNumber="0938 789 123"
                bankName="Vietcombank"
              />
              <p className="text-xs font-bold text-slate-800 mt-2">
                Quét VietQR từ bất kỳ App Ngân Hàng hoặc Ví điện tử
              </p>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl text-center">
              <DollarSign className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-slate-900 text-sm">
                Xác nhận thu tiền mặt tại chỗ
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng đếm đủ số tiền{' '}
                <strong className="text-slate-800">{formatVND(pricing.totalPayable)}</strong> trước
                khi bấm hoàn tất.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isPaidSuccess ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Đã ghi nhận giao dịch vào Sổ cái thanh toán (Payment Ledger DEC-03)
          </div>
        ) : (
          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={handleComplete}
          >
            <CheckCircle2 className="w-5 h-5 mr-1" />
            Ghi nhận thu tiền vào sổ cái ({formatVND(pricing.totalPayable)})
          </Button>
        )}
      </div>
    </Modal>
  );
};
