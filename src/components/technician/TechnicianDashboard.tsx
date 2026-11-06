import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  ChevronRight,
  Search,
  Plus,
  Wrench,
  Snowflake,
  AlertTriangle,
  Zap,
  Calendar,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { Job, JobStatus } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { Button } from '../ui/Button';

interface TechnicianDashboardProps {
  jobs: Job[];
  onOpenDetails: (job: Job) => void;
  onQuickAction: (job: Job) => void;
  onOpenInvoice: (job: Job) => void;
  onCreateJobRequest: () => void;
  technicianName?: string;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  jobs,
  onOpenDetails,
  onQuickAction,
  onOpenInvoice,
  onCreateJobRequest,
  technicianName = 'Trần Văn Hùng',
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const todayJobs = jobs.filter((j) => j.scheduledDate === 'Hôm nay');
  const inProgressJobs = todayJobs.filter((j) =>
    ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'].includes(j.status)
  );
  const pendingJobs = todayJobs.filter((j) => j.status === 'MOI');
  const completedJobs = todayJobs.filter((j) => j.status === 'HOAN_THANH');

  const totalRevenueToday = todayJobs.reduce((sum, job) => {
    if (job.status === 'DA_HUY') return sum;
    const servicesTotal = job.selectedServices.reduce((s, item) => s + item.price * item.quantity, 0);
    const partsTotal = job.spareParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
    return sum + (servicesTotal + partsTotal);
  }, 0);

  // Spotlight Next Job: Ca đang thực hiện hoặc ca chờ nhận đầu tiên
  const spotlightJob = inProgressJobs[0] || pendingJobs[0] || todayJobs[0];

  const displayedJobs = todayJobs.filter((job) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = job.customerName.toLowerCase().includes(q);
      const matchAddr = job.address.toLowerCase().includes(q);
      const matchBrand = job.brand.toLowerCase().includes(q);
      if (!matchName && !matchAddr && !matchBrand) return false;
    }
    if (filterMode === 'ACTIVE') {
      return ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'].includes(job.status);
    }
    if (filterMode === 'PENDING') return job.status === 'MOI';
    if (filterMode === 'COMPLETED') return job.status === 'HOAN_THANH';
    return true;
  });

  // Natural human microcopy without internal code references
  const getStatusHumanLabel = (status: JobStatus) => {
    switch (status) {
      case 'MOI':
        return { label: 'Chờ nhận ca', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
      case 'DANG_TOI':
        return { label: 'Đang trên đường tới', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'DANG_KIEM_TRA':
        return { label: 'Đang kiểm tra máy', bg: 'bg-teal-100 text-teal-900 border-teal-300' };
      case 'BAO_GIA':
        return { label: 'Chờ khách duyệt giá', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
      case 'DANG_SUA':
        return { label: 'Đang sửa chữa', bg: 'bg-teal-100 text-teal-900 border-teal-300' };
      case 'HOAN_THANH':
        return { label: 'Hoàn tất công việc', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'DA_HUY':
        return { label: 'Đã hủy', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getNextActionLabel = (status: JobStatus) => {
    switch (status) {
      case 'MOI':
        return 'Bấm đang đến';
      case 'DANG_TOI':
        return 'Bắt đầu kiểm tra máy';
      case 'DANG_KIEM_TRA':
        return 'Lập báo giá linh kiện';
      case 'BAO_GIA':
        return 'Khách đã duyệt → Bắt đầu sửa';
      case 'DANG_SUA':
        return 'Hoàn thành công việc';
      case 'HOAN_THANH':
        return 'Sổ cái thu tiền';
      default:
        return 'Xem tiến độ';
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* 1. COMPACT GREETING & SUMMARY HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Lịch trực hôm nay
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 mt-0.5">
            <span>Chào {technicianName}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-semibold text-slate-800">
              {todayJobs.length} ca làm việc
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Doanh số tạm tính:</span>
            <strong className="font-mono text-slate-900 font-bold">{formatVND(totalRevenueToday)}</strong>
          </div>
        </div>

        <Button
          variant="teal"
          size="md"
          onClick={onCreateJobRequest}
          className="self-start sm:self-auto flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm ca mới</span>
        </Button>
      </div>

      {/* 2. SPOTLIGHT HERO: Ca ưu tiên cần xử lý ngay */}
      {spotlightJob && (
        <div className="bg-[#0a1e3f] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
          {/* Top meta row */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                Ca ưu tiên xử lý ngay
              </span>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusHumanLabel(spotlightJob.status).bg}`}>
              {getStatusHumanLabel(spotlightJob.status).label}
            </span>
          </div>

          {/* Customer & Address & Time */}
          <div className="py-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h2 className="text-2xl font-black text-white leading-tight">
                {spotlightJob.customerName}
              </h2>
              <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-teal-300">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>{spotlightJob.scheduledTime}</span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-sm text-slate-200">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>{spotlightJob.address}, {spotlightJob.district}</span>
            </div>

            <div className="text-xs text-slate-300 pt-1 flex items-center gap-2">
              <span className="font-semibold text-white">{spotlightJob.brand} {spotlightJob.horsePower}</span>
              <span className="text-slate-500">·</span>
              <span>{spotlightJob.airconType === 'AM_TRAN' ? 'Âm trần Cassette' : 'Treo tường'}</span>
            </div>

            {/* Problem Symptom Callout */}
            {spotlightJob.symptoms.length > 0 && (
              <div className="mt-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                <span className="font-semibold leading-relaxed">
                  Báo hỏng: {spotlightJob.symptoms.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Large Touch-Zone Action Bar (>= 48px height) */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <a
              href={`tel:${spotlightJob.customerPhone.replace(/\s+/g, '')}`}
              className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi điện khách</span>
            </a>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${spotlightJob.address}, ${spotlightJob.district}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors active:scale-95"
            >
              <Navigation className="w-4 h-4 text-teal-400" />
              <span>Chỉ đường</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (spotlightJob.status === 'HOAN_THANH') {
                  onOpenInvoice(spotlightJob);
                } else {
                  onQuickAction(spotlightJob);
                }
              }}
              className="col-span-2 sm:col-span-1 h-12 rounded-xl bg-[#0d9488] hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95"
            >
              <Zap className="w-4 h-4 text-teal-200" />
              <span>{getNextActionLabel(spotlightJob.status)}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 w-full max-w-full">
        {/* Filter Segmented Control */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto no-scrollbar w-full sm:w-auto max-w-full">
          {[
            { key: 'ALL', label: `Tất cả (${todayJobs.length})` },
            { key: 'ACTIVE', label: `Đang làm (${inProgressJobs.length})` },
            { key: 'PENDING', label: `Chờ nhận (${pendingJobs.length})` },
            { key: 'COMPLETED', label: `Đã xong (${completedJobs.length})` },
          ].map((tab) => {
            const isActive = filterMode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterMode(tab.key as any)}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex-1 sm:flex-initial text-center ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search input with 14px text */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, địa chỉ, máy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900 placeholder-slate-400 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* 4. SUBSEQUENT JOBS LIST */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Danh sách ca trong ngày ({displayedJobs.length})
          </h2>
        </div>

        {displayedJobs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            Không tìm thấy ca công việc nào phù hợp với bộ lọc.
          </div>
        ) : (
          displayedJobs.map((job) => {
            const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
            const isSpotlight = spotlightJob && spotlightJob.id === job.id;
            const statusMeta = getStatusHumanLabel(job.status);

            return (
              <div
                key={job.id}
                onClick={() => onOpenDetails(job)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSpotlight
                    ? 'bg-teal-50/30 border-teal-300 shadow-xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Time & Human Status Label */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 font-mono text-xs bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {job.scheduledTime}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusMeta.bg}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                      {job.customerName}
                    </h3>

                    <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.address}, {job.district}</span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-0.5">
                      <span className="font-semibold text-slate-800">{job.brand} {job.horsePower}</span>
                      <span className="text-slate-300">·</span>
                      <span>Tạm tính:</span>
                      <strong className="font-mono text-slate-900 font-bold text-sm">
                        {formatVND(pricing.totalPayable)}
                      </strong>
                    </div>
                  </div>

                  {/* Thumb-Zone Quick Action Controls on Right */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <a
                      href={`tel:${job.customerPhone.replace(/\s+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200/70 active:scale-95 transition-transform"
                      aria-label="Gọi điện nhanh"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetails(job);
                      }}
                      className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <span>Chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
