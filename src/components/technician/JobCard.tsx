import React from 'react';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  ChevronRight,
  Snowflake,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Job } from '../../lib/types';
import { STATUS_MAP } from '../../lib/status-machine';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface JobCardProps {
  job: Job;
  onOpenDetails: (job: Job) => void;
  onQuickAction: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onOpenDetails, onQuickAction }) => {
  const statusMeta = STATUS_MAP[job.status] || STATUS_MAP.MOI;
  const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);

  // Status badge styling
  const getStatusBadge = () => {
    switch (job.status) {
      case 'MOI':
        return <Badge variant="navy">Đơn mới</Badge>;
      case 'DANG_TOI':
        return <Badge variant="warning">Đang tới (còn {job.distanceKm} km)</Badge>;
      case 'DANG_KIEM_TRA':
        return <Badge variant="teal">Đang kiểm tra máy</Badge>;
      case 'BAO_GIA':
        return <Badge variant="warning">Chờ duyệt giá</Badge>;
      case 'DANG_SUA':
        return <Badge variant="teal">Đang sửa / vệ sinh</Badge>;
      case 'HOAN_THANH':
        return <Badge variant="success">Đã hoàn thành</Badge>;
      case 'DA_HUY':
        return <Badge variant="neutral">Đã hủy</Badge>;
      default:
        return <Badge>{statusMeta.label}</Badge>;
    }
  };

  const getAirconTypeName = (type: string) => {
    switch (type) {
      case 'AM_TRAN':
        return 'Âm trần Cassette';
      case 'TU_DUNG':
        return 'Tủ đứng';
      case 'MULTI':
        return 'Hệ Multi';
      default:
        return 'Treo tường';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition-all hover:border-slate-300">
      {/* Top row: Scheduled time & Status */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
          <Clock className="w-4 h-4 text-[#0d9488]" />
          <span>{job.scheduledTime}</span>
          <span className="text-xs font-normal text-slate-500 ml-1">({job.scheduledDate})</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Customer & Location Info */}
      <div className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base leading-tight">
              {job.customerName}
            </h3>
            <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{job.address}, {job.district}</span>
            </div>
          </div>

          {/* Quick Call & Map Buttons (One-Handed reachable) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${job.customerPhone.replace(/\s+/g, '')}`}
              aria-label={`Gọi khách hàng ${job.customerName}`}
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors border border-emerald-200/80 active:scale-95"
            >
              <Phone className="w-4 h-4" />
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${job.address}, ${job.district}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chỉ đường Google Maps"
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition-colors border border-blue-200/80 active:scale-95"
            >
              <Navigation className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Machine & Symptoms */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100/60 text-[#0d9488] flex items-center justify-center">
              <Snowflake className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">
                {job.brand} • {job.horsePower}
              </div>
              <div className="text-[11px] text-slate-500">
                {getAirconTypeName(job.airconType)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tạm tính</div>
            <div className="font-bold text-slate-900 text-sm">
              {formatVND(pricing.totalPayable)}
            </div>
          </div>
        </div>

        {/* Symptoms tags */}
        {job.symptoms.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {job.symptoms.map((sym, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md"
              >
                <AlertCircle className="w-3 h-3 text-rose-500" />
                {sym}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
        <Button
          variant="outline"
          size="md"
          className="flex-1"
          aria-label={`Chi tiết ca ${job.customerName}`}
          onClick={() => onOpenDetails(job)}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          Chi tiết
        </Button>

        {job.status === 'MOI' && (
          <Button
            variant="teal"
            size="md"
            className="flex-1"
            onClick={() => onQuickAction(job)}
          >
            Nhận việc ngay
          </Button>
        )}

        {job.status === 'DANG_TOI' && (
          <Button
            variant="teal"
            size="md"
            className="flex-1"
            onClick={() => onQuickAction(job)}
          >
            Đã đến nơi
          </Button>
        )}

        {job.status === 'DANG_KIEM_TRA' && (
          <Button
            variant="teal"
            size="md"
            className="flex-1"
            onClick={() => onOpenDetails(job)}
          >
            Lập báo giá
          </Button>
        )}

        {job.status === 'BAO_GIA' && (
          <Button
            variant="teal"
            size="md"
            className="flex-1"
            onClick={() => onQuickAction(job)}
          >
            Khách đã duyệt
          </Button>
        )}

        {job.status === 'DANG_SUA' && (
          <Button
            variant="success"
            size="md"
            className="flex-1"
            onClick={() => onOpenDetails(job)}
          >
            Nghiệm thu
          </Button>
        )}

        {job.status === 'HOAN_THANH' && (
          <Button
            variant="outline"
            size="md"
            className="flex-1 text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
            onClick={() => onOpenDetails(job)}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Phiếu thu & QR
          </Button>
        )}
      </div>
    </div>
  );
};
