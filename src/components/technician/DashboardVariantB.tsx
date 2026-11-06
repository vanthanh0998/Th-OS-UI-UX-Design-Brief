import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  ChevronRight,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Wrench,
  Snowflake,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Job, JobStatus } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { sortJobs } from '../../lib/booking-validation';
import { Button } from '../ui/Button';

interface DashboardVariantBProps {
  jobs: Job[];
  onOpenDetails: (job: Job) => void;
  onQuickAction: (job: Job) => void;
  onOpenInvoice: (job: Job) => void;
  onCreateJobRequest: () => void;
  technicianName?: string;
}

export const DashboardVariantB: React.FC<DashboardVariantBProps> = ({
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

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'MOI':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">Chờ nhận ca</span>;
      case 'DANG_TOI':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">Đang đến (ETA-001)</span>;
      case 'DANG_KIEM_TRA':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">Đang kiểm tra</span>;
      case 'BAO_GIA':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">Chờ duyệt giá</span>;
      case 'DANG_SUA':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">Đang sửa / bảo dưỡng</span>;
      case 'HOAN_THANH':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Hoàn thành</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* SPOTLIGHT HERO: Ca đang thực hiện hoặc ca kế tiếp (Field Service Priority) */}
      {spotlightJob && (
        <div className="bg-[#0a1e3f] text-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-teal-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                Ca ưu tiên hiện tại
              </span>
            </div>
            {getStatusBadge(spotlightJob.status)}
          </div>

          <div className="space-y-1.5">
            <div className="text-xl sm:text-2xl font-black text-white leading-tight">
              {spotlightJob.customerName}
            </div>
            <div className="flex items-start gap-1.5 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span className="font-medium">{spotlightJob.address}, {spotlightJob.district}</span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-2 pt-1">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-bold text-white font-mono">{spotlightJob.scheduledTime}</span>
              <span>·</span>
              <span>{spotlightJob.brand} {spotlightJob.horsePower}</span>
            </div>
          </div>

          {/* Urgent symptoms banner */}
          {spotlightJob.symptoms.length > 0 && (
            <div className="mt-3.5 p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
              <span className="font-semibold">Báo hỏng: {spotlightJob.symptoms.join(', ')}</span>
            </div>
          )}

          {/* Direct 1-Handed Action Buttons */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <a
              href={`tel:${spotlightJob.customerPhone.replace(/\s+/g, '')}`}
              className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi điện khách</span>
            </a>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spotlightJob.address}, ${spotlightJob.district}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors active:scale-95"
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
              className="col-span-2 sm:col-span-1 h-12 rounded-xl bg-[#0d9488] hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95"
            >
              <Zap className="w-4 h-4 text-teal-200" />
              <span>
                {spotlightJob.status === 'MOI'
                  ? 'Bấm Đang Đến (ETA-001)'
                  : spotlightJob.status === 'DANG_TOI'
                  ? 'Bắt đầu kiểm tra máy'
                  : spotlightJob.status === 'DANG_KIEM_TRA'
                  ? 'Lập báo giá linh kiện'
                  : spotlightJob.status === 'HOAN_THANH'
                  ? 'Mở Sổ Cái Thu Tiền'
                  : 'Tiến độ tiếp theo'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* QUICK STATUS BAR & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Large Touch Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { key: 'ALL', label: `Tất cả (${todayJobs.length})` },
              { key: 'ACTIVE', label: `Đang làm (${inProgressJobs.length})` },
              { key: 'PENDING', label: `Chờ nhận (${pendingJobs.length})` },
              { key: 'COMPLETED', label: `Xong (${completedJobs.length})` },
            ].map((tab) => {
              const isActive = filterMode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterMode(tab.key as any)}
                  className={`h-10 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-[#0a1e3f] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm ca làm việc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:bg-white focus:border-teal-600 text-slate-900 font-medium"
            />
          </div>
        </div>
      </div>

      {/* LIST OF TODAY'S JOBS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Danh sách ca trong ngày ({displayedJobs.length})
          </h2>
          <button
            type="button"
            onClick={onCreateJobRequest}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ca mới</span>
          </button>
        </div>

        {displayedJobs.map((job) => {
          const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
          const isCurrentActive = spotlightJob && spotlightJob.id === job.id;

          return (
            <div
              key={job.id}
              onClick={() => onOpenDetails(job)}
              className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                isCurrentActive
                  ? 'bg-teal-50/40 border-teal-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {job.scheduledTime}
                    </span>
                    {getStatusBadge(job.status)}
                  </div>

                  <h3 className="font-black text-slate-900 text-base leading-snug pt-0.5">
                    {job.customerName}
                  </h3>

                  <div className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{job.address}, {job.district}</span>
                  </div>

                  <div className="text-xs text-slate-500 pt-1 flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{job.brand} {job.horsePower}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-slate-900">{formatVND(pricing.totalPayable)}</span>
                  </div>
                </div>

                {/* Thumb-Zone Quick Action on the Right */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <a
                    href={`tel:${job.customerPhone.replace(/\s+/g, '')}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200 active:scale-95 transition-transform"
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
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    <span>Chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
