import React from 'react';
import {
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Snowflake,
  User,
  Wrench,
  Navigation,
  FileText,
} from 'lucide-react';
import { Job } from '../../lib/types';
import { STATUS_MAP } from '../../lib/status-machine';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface CustomerTrackingViewProps {
  job: Job;
  onBookAnother: () => void;
  onViewInvoice?: (job: Job) => void;
}

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  job,
  onBookAnother,
  onViewInvoice,
}) => {
  const statusMeta = STATUS_MAP[job.status] || STATUS_MAP.MOI;
  const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Live Status Card */}
      <div className="bg-gradient-to-br from-[#0a1e3f] to-[#0f2c59] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="teal" className="bg-[#0d9488]/30 text-teal-200 border-teal-300/30">
            Mã đơn: #{job.id}
          </Badge>
          <div className="text-xs text-slate-300">
            Hẹn: <strong className="text-white">{job.scheduledTime}</strong> ({job.scheduledDate})
          </div>
        </div>

        <div className="my-2">
          <div className="text-xs text-teal-300 font-semibold uppercase tracking-wider mb-1">
            Trạng thái hiện tại:
          </div>
          <h2 className="text-2xl font-black text-white">{statusMeta.label}</h2>
          <p className="text-xs text-slate-300 mt-1">{statusMeta.description}</p>
        </div>

        {/* Assigned Technician Profile Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Thợ kỹ thuật phụ trách:</div>
              <div className="text-sm font-bold text-white">{job.technicianName}</div>
            </div>
          </div>

          <a
            href={`tel:${job.technicianPhone.replace(/\s+/g, '')}`}
            className="px-3.5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            Gọi Thợ
          </a>
        </div>
      </div>

      {/* Aircon Job Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-[#0d9488]" />
            <span className="font-bold text-slate-900 text-sm">
              {job.brand} • {job.horsePower}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {job.airconType === 'AM_TRAN' ? 'Âm trần' : 'Treo tường'}
          </span>
        </div>

        <div className="text-xs text-slate-600 flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{job.address}, {job.district}</span>
        </div>

        {job.symptoms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {job.symptoms.map((s, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Pricing breakdown */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Dịch vụ kỹ thuật:</span>
            <span className="font-semibold text-slate-900">{formatVND(pricing.subtotalServices)}</span>
          </div>
          {pricing.subtotalParts > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Linh kiện thay thế:</span>
              <span className="font-semibold text-slate-900">{formatVND(pricing.subtotalParts)}</span>
            </div>
          )}
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Giảm giá:</span>
              <span className="font-semibold">-{formatVND(pricing.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Tổng chi phí:</span>
            <span className="text-[#0d9488] text-base">{formatVND(pricing.totalPayable)}</span>
          </div>
        </div>

        {/* Finished / Warranty Stamp if Done */}
        {job.status === 'HOAN_THANH' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-900 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Đơn hàng đã hoàn thành và kích hoạt bảo hành điện tử
            </div>
            <p className="text-[11px] text-emerald-700">
              Nhiệt độ đo cửa gió đạt chuẩn: {job.checklist.tempColdAirC || 12}°C. Thời hạn bảo hành: 3 - 6 tháng kể từ ngày làm.
            </p>
            {onViewInvoice && (
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-emerald-300 text-emerald-800"
                  onClick={() => onViewInvoice(job)}
                >
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Xem Biên Nhận & Phiếu Bảo Hành
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <Button variant="outline" size="md" fullWidth onClick={onBookAnother}>
            Đặt thêm máy khác hoặc kiểm tra định kỳ
          </Button>
        </div>
      </div>
    </div>
  );
};
