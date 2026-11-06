import React from 'react';
import { Calendar, CheckCircle2, Clock, DollarSign, Wrench } from 'lucide-react';
import { Job } from '../../lib/types';
import { formatVND } from '../../lib/pricing';

interface TodayStatsBannerProps {
  jobs: Job[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  technicianName?: string;
}

export const TodayStatsBanner: React.FC<TodayStatsBannerProps> = ({
  jobs,
  activeFilter,
  onFilterChange,
  technicianName = 'Trần Văn Hùng',
}) => {
  const todayJobs = jobs.filter((j) => j.scheduledDate === 'Hôm nay');
  const inProgressJobs = todayJobs.filter((j) => ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'].includes(j.status));
  const completedJobs = todayJobs.filter((j) => j.status === 'HOAN_THANH');
  const pendingJobs = todayJobs.filter((j) => j.status === 'MOI');

  // Tổng giá trị dịch vụ của các ca hôm nay
  const totalServicesValue = todayJobs.reduce((sum, job) => {
    if (job.status === 'DA_HUY') return sum;
    const servicesTotal = job.selectedServices.reduce((s, item) => s + item.price * item.quantity, 0);
    const partsTotal = job.spareParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
    return sum + (servicesTotal + partsTotal);
  }, 0);

  return (
    <div className="bg-gradient-to-br from-[#0a1e3f] via-[#0f2c59] to-[#0a1e3f] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden mb-5">
      {/* Background ambient pattern */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#0d9488]/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-12 -bottom-10 w-32 h-32 bg-[#06b6d4]/15 rounded-full blur-xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">
              Thợ chính trực ca
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Chào {technicianName}!
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-300 flex items-center justify-end gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#14b8a6]" />
            <span>Hôm nay</span>
          </div>
          <div className="text-sm font-semibold text-white">5 Tháng 11, 2026</div>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4 relative z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
          <div className="text-slate-300 text-[11px] font-medium flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-[#14b8a6]" />
            <span>Tổng đơn</span>
          </div>
          <div className="text-2xl font-black text-white">{todayJobs.length}</div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            {pendingJobs.length > 0 ? `${pendingJobs.length} đơn mới` : 'Đã nhận hết'}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
          <div className="text-slate-300 text-[11px] font-medium flex items-center gap-1 mb-1">
            <Wrench className="w-3 h-3 text-amber-300" />
            <span>Đang xử lý</span>
          </div>
          <div className="text-2xl font-black text-amber-300">{inProgressJobs.length}</div>
          <div className="text-[10px] text-slate-300 mt-0.5">
            {completedJobs.length} đã xong
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
          <div className="text-slate-300 text-[11px] font-medium flex items-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-emerald-300" />
            <span>Doanh số ca</span>
          </div>
          <div className="text-base font-black text-emerald-300 truncate">
            {formatVND(totalServicesValue)}
          </div>
          <div className="text-[10px] text-emerald-200 mt-0.5">Tổng giá trị hôm nay</div>
        </div>
      </div>

      {/* Filter Tabs - Designed for Quick 1-Handed Tap */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 relative z-10">
        {[
          { key: 'ALL', label: `Tất cả (${todayJobs.length})` },
          { key: 'ACTIVE', label: `Đang làm (${inProgressJobs.length})` },
          { key: 'PENDING', label: `Chờ nhận (${pendingJobs.length})` },
          { key: 'COMPLETED', label: `Đã xong (${completedJobs.length})` },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterChange(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all touch-target flex items-center justify-center ${
                isActive
                  ? 'bg-[#0d9488] text-white shadow-sm'
                  : 'bg-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
