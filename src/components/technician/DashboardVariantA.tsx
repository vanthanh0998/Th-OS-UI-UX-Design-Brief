import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  ChevronRight,
  Search,
  Plus,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Wrench,
  Snowflake,
} from 'lucide-react';
import { Job, JobStatus } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { sortJobs } from '../../lib/booking-validation';
import { Button } from '../ui/Button';

interface DashboardVariantAProps {
  jobs: Job[];
  onOpenDetails: (job: Job) => void;
  onQuickAction: (job: Job) => void;
  onOpenInvoice: (job: Job) => void;
  onCreateJobRequest: () => void;
  technicianName?: string;
}

export const DashboardVariantA: React.FC<DashboardVariantAProps> = ({
  jobs,
  onOpenDetails,
  onQuickAction,
  onOpenInvoice,
  onCreateJobRequest,
  technicianName = 'Trần Văn Hùng',
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Daily metrics calculation
  const todayJobs = jobs.filter((j) => j.scheduledDate === 'Hôm nay');
  const inProgressJobs = todayJobs.filter((j) =>
    ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'].includes(j.status)
  );
  const upcomingJobs = todayJobs.filter((j) => j.status === 'MOI');
  const completedJobs = todayJobs.filter((j) => j.status === 'HOAN_THANH');

  const totalRevenueToday = todayJobs.reduce((sum, job) => {
    if (job.status === 'DA_HUY') return sum;
    const servicesTotal = job.selectedServices.reduce((s, item) => s + item.price * item.quantity, 0);
    const partsTotal = job.spareParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
    return sum + (servicesTotal + partsTotal);
  }, 0);

  // Filtered jobs
  const displayedJobs = todayJobs.filter((job) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = job.customerName.toLowerCase().includes(q);
      const matchAddr = job.address.toLowerCase().includes(q);
      const matchBrand = job.brand.toLowerCase().includes(q);
      const matchId = job.id.toLowerCase().includes(q);
      if (!matchName && !matchAddr && !matchBrand && !matchId) return false;
    }
    if (filterMode === 'UPCOMING') return job.status === 'MOI';
    if (filterMode === 'IN_PROGRESS') {
      return ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'].includes(job.status);
    }
    if (filterMode === 'COMPLETED') return job.status === 'HOAN_THANH';
    return true;
  });

  const getStatusTypography = (status: JobStatus) => {
    switch (status) {
      case 'MOI':
        return {
          label: 'Chờ phân công ca',
          color: 'text-slate-600',
          dot: 'bg-slate-400',
        };
      case 'DANG_TOI':
        return {
          label: 'Đang đến (ETA-001)',
          color: 'text-amber-800',
          dot: 'bg-amber-500',
        };
      case 'DANG_KIEM_TRA':
        return {
          label: 'Đang kiểm tra kỹ thuật',
          color: 'text-teal-800',
          dot: 'bg-teal-500',
        };
      case 'BAO_GIA':
        return {
          label: 'Chờ khách duyệt báo giá',
          color: 'text-indigo-800',
          dot: 'bg-indigo-500',
        };
      case 'DANG_SUA':
        return {
          label: 'Đang bảo dưỡng / sửa chữa',
          color: 'text-teal-800',
          dot: 'bg-teal-500',
        };
      case 'HOAN_THANH':
        return {
          label: 'Hoàn thành công việc',
          color: 'text-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'DA_HUY':
        return {
          label: 'Đã hủy',
          color: 'text-rose-700',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          color: 'text-slate-600',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* SECTION 1: Clean Executive Metric Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              Bảng điều hành trực nhật
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Hôm nay, {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="teal"
              size="sm"
              onClick={onCreateJobRequest}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo yêu cầu mới</span>
            </Button>
          </div>
        </div>

        {/* 3 Metric Columns with Tabular Numerals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Tổng số ca làm
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {todayJobs.length}
              </span>
              <span className="text-xs text-slate-500">
                {upcomingJobs.length > 0 ? `${upcomingJobs.length} ca chờ nhận` : 'Đã tiếp nhận hết'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Đang thực hiện
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-teal-700">
                {inProgressJobs.length}
              </span>
              <span className="text-xs text-slate-500">
                {completedJobs.length} ca đã hoàn tất
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Doanh số tạm tính
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
                {formatVND(totalRevenueToday)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Filter Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Clean Segmented Filter Bar */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto no-scrollbar">
          {[
            { key: 'ALL', label: `Tất cả (${todayJobs.length})` },
            { key: 'IN_PROGRESS', label: `Đang xử lý (${inProgressJobs.length})` },
            { key: 'UPCOMING', label: `Chờ nhận (${upcomingJobs.length})` },
            { key: 'COMPLETED', label: `Đã xong (${completedJobs.length})` },
          ].map((tab) => {
            const isActive = filterMode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterMode(tab.key as any)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Quiet Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, địa chỉ, máy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* SECTION 3: Structured Clean Job Cards */}
      <div className="space-y-3.5">
        {displayedJobs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            Không tìm thấy ca công việc nào phù hợp với bộ lọc.
          </div>
        ) : (
          displayedJobs.map((job) => {
            const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
            const statusStyle = getStatusTypography(job.status);

            return (
              <div
                key={job.id}
                onClick={() => onOpenDetails(job)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
              >
                {/* Header row: Time & Clean Status */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900 font-mono tabular-nums">
                      {job.scheduledTime}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>{job.scheduledDate}</span>
                  </div>

                  {/* Clean typographic status without loud pill */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                    <span className={statusStyle.color}>{statusStyle.label}</span>
                  </div>
                </div>

                {/* Body Content: Customer & Aircon specs */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {job.customerName}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{job.address}, {job.district}</span>
                    </div>
                    <div className="text-xs text-slate-500 pt-0.5">
                      <span className="font-medium text-slate-700">{job.brand} {job.horsePower}</span>
                      <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                      <span>{job.airconType === 'AM_TRAN' ? 'Âm trần Cassette' : 'Treo tường'}</span>
                      {job.symptoms.length > 0 && (
                        <>
                          <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                          <span className="text-rose-700 font-medium">
                            {job.symptoms.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <div className="text-left sm:text-right">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                        Giá trị ca
                      </div>
                      <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                        {formatVND(pricing.totalPayable)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${job.customerPhone.replace(/\s+/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Gọi khách ${job.customerName}`}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <Button
                        variant={job.status === 'MOI' ? 'teal' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (job.status === 'HOAN_THANH') {
                            onOpenInvoice(job);
                          } else {
                            onQuickAction(job);
                          }
                        }}
                      >
                        {job.status === 'MOI'
                          ? 'Nhận ca'
                          : job.status === 'HOAN_THANH'
                          ? 'Sổ cái thu tiền'
                          : 'Tiến độ tiếp theo'}
                      </Button>
                    </div>
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
