import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Filter,
  Flame,
  Search,
  Sparkles,
  Zap,
  Snowflake,
  Wrench,
  Gauge,
  Plus,
} from 'lucide-react';
import { Job, JobStatus } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { sortJobs } from '../../lib/booking-validation';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

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
  // Sort mode: 'TIME' (Theo thời gian) vs 'PRIORITY' (Theo mức ưu tiên / cự ly)
  const [sortMode, setSortMode] = useState<'TIME' | 'PRIORITY'>('TIME');

  // Filter mode: 'ALL' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'
  const [filterMode, setFilterMode] = useState<'ALL' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Search keyword
  const [searchQuery, setSearchQuery] = useState('');

  // Daily metrics calculation
  const todayJobs = jobs.filter((j) => j.scheduledDate === 'Hôm nay' || j.scheduledDate === 'Hôm nay');
  const upcomingJobs = todayJobs.filter((j) => j.status === 'MOI');
  const inProgressJobs = todayJobs.filter((j) =>
    ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'].includes(j.status)
  );
  const completedJobs = todayJobs.filter((j) => j.status === 'HOAN_THANH');

  const totalValueToday = todayJobs.reduce((sum, job) => {
    if (job.status === 'DA_HUY') return sum;
    const servicesTotal = job.selectedServices.reduce((s, item) => s + item.price * item.quantity, 0);
    const partsTotal = job.spareParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
    return sum + (servicesTotal + partsTotal);
  }, 0);

  // Spotlight Next Job: Ca đang thực hiện hoặc ca sắp tới gần nhất
  const nextSpotlightJob =
    inProgressJobs[0] ||
    todayJobs.find((j) => j.status === 'MOI') ||
    todayJobs[0];

  // Apply sorting and filtering
  const sortedAllJobs = sortJobs<Job>(todayJobs, sortMode);

  const displayedJobs = sortedAllJobs.filter((job) => {
    // Search filter
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

  const getStatusDisplay = (status: JobStatus) => {
    switch (status) {
      case 'MOI':
        return {
          label: 'Sắp tới',
          subLabel: 'Chờ thợ nhận',
          variant: 'navy' as const,
          bgClass: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'DANG_TOI':
        return {
          label: 'Đang thực hiện',
          subLabel: 'Đang di chuyển tới',
          variant: 'warning' as const,
          bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'DANG_KIEM_TRA':
      case 'BAO_GIA':
      case 'DANG_SUA':
        return {
          label: 'Đang thực hiện',
          subLabel: status === 'BAO_GIA' ? 'Chờ duyệt giá' : 'Đang xử lý máy',
          variant: 'teal' as const,
          bgClass: 'bg-teal-50 text-teal-800 border-teal-200',
        };
      case 'HOAN_THANH':
        return {
          label: 'Đã hoàn thành',
          subLabel: 'Đã nghiệm thu & thu tiền',
          variant: 'success' as const,
          bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      default:
        return {
          label: 'Đã hủy',
          subLabel: '',
          variant: 'neutral' as const,
          bgClass: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
  };

  const getServiceTypeName = (st: string) => {
    switch (st) {
      case 'VE_SINH':
        return 'Vệ sinh & Bảo trì';
      case 'SUA_CHUA':
        return 'Sửa chữa máy lạnh';
      case 'NAP_GAS':
        return 'Bổ sung Gas Inverter';
      case 'THAO_LAP':
        return 'Lắp đặt mới / Di dời';
      default:
        return 'Kiểm tra máy';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bảng Điều Phối Lịch Trực Ca */}
      <div className="bg-gradient-to-br from-[#0a1e3f] via-[#0f2c59] to-[#0a1e3f] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Thợ chính trực ca
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Chào {technicianName}!
            </h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-teal-200 font-semibold flex items-center justify-end gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch Hôm Nay</span>
            </div>
            <div className="text-xs font-bold text-white mt-0.5">5 Tháng 11, 2026</div>
          </div>
        </div>

        {/* 3 Thẻ Chỉ Số Trực Quan */}
        <div className="grid grid-cols-3 gap-2.5 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-slate-300 text-[10px] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#14b8a6]" />
              <span>Hôm nay</span>
            </div>
            <div className="text-xl font-black text-white mt-0.5">{todayJobs.length} ca</div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {upcomingJobs.length} ca sắp tới
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-slate-300 text-[10px] font-medium flex items-center gap-1">
              <Wrench className="w-3 h-3 text-amber-300" />
              <span>Đang làm</span>
            </div>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              {inProgressJobs.length} ca
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {completedJobs.length} đã xong
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-slate-300 text-[10px] font-medium flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-300" />
              <span>Giá trị ca</span>
            </div>
            <div className="text-base font-black text-emerald-300 mt-0.5 truncate">
              {formatVND(totalValueToday)}
            </div>
            <div className="text-[10px] text-emerald-200 mt-0.5">Tổng giá trị hôm nay</div>
          </div>
        </div>
      </div>

      {/* 2. Tiêu Điểm "Ca Tiếp Theo Cần Làm" (Next Active Job Spotlight) */}
      {nextSpotlightJob && nextSpotlightJob.status !== 'HOAN_THANH' && (
        <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border-2 border-[#0d9488]/40 rounded-3xl p-4 sm:p-5 shadow-xs relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#0f766e]">
              <Zap className="w-4 h-4 text-[#0d9488] fill-[#0d9488]" />
              <span>CA CẦN XỬ LÝ TIẾP THEO</span>
            </div>
            <Badge variant="warning">
              {nextSpotlightJob.status === 'DANG_TOI' ? 'Đang trên đường đến' : 'Sắp diễn ra'}
            </Badge>
          </div>

          <div className="flex items-start justify-between gap-3 my-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {nextSpotlightJob.customerName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                <span className="font-bold text-slate-800">{nextSpotlightJob.scheduledTime}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">{nextSpotlightJob.district}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                {nextSpotlightJob.address}, {nextSpotlightJob.district}
              </p>
            </div>

            {/* Nút gọi và bản đồ ngón cái */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${nextSpotlightJob.customerPhone.replace(/\s+/g, '')}`}
                aria-label={`Gọi khách hàng ${nextSpotlightJob.customerName}`}
                className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${nextSpotlightJob.address}, ${nextSpotlightJob.district}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mở Google Maps chỉ đường"
                className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
              >
                <Navigation className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Action One-Handed Button */}
          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => onOpenDetails(nextSpotlightJob)}
            >
              Mở Biên Bản Kiểm Tra
            </Button>
            <Button
              variant="teal"
              size="md"
              className="flex-1 font-bold"
              onClick={() => onQuickAction(nextSpotlightJob)}
            >
              {nextSpotlightJob.status === 'MOI' && 'Nhận ca & Xuất phát'}
              {nextSpotlightJob.status === 'DANG_TOI' && 'Đã đến nhà khách'}
              {nextSpotlightJob.status === 'DANG_KIEM_TRA' && 'Lập báo giá'}
              {nextSpotlightJob.status === 'BAO_GIA' && 'Khách duyệt -> Làm ngay'}
              {nextSpotlightJob.status === 'DANG_SUA' && 'Nghiệm thu ca việc'}
            </Button>
          </div>
        </div>
      )}

      {/* 3. Thanh Công Cụ Lọc & Sắp Xếp (Mobile-First Ergonomic Toolbar) */}
      <div className="space-y-2.5">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên khách, địa chỉ, loại máy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-3.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
            />
          </div>
          <Button
            variant="teal"
            size="md"
            className="rounded-2xl shrink-0"
            onClick={onCreateJobRequest}
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm ca
          </Button>
        </div>

        {/* Toggle Sắp Xếp & Lọc Trạng Thái */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Lọc Trạng Thái */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { key: 'ALL', label: `Tất cả (${todayJobs.length})` },
              { key: 'UPCOMING', label: `Sắp tới (${upcomingJobs.length})` },
              { key: 'IN_PROGRESS', label: `Đang làm (${inProgressJobs.length})` },
              { key: 'COMPLETED', label: `Đã xong (${completedJobs.length})` },
            ].map((tab) => {
              const active = filterMode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterMode(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap touch-target ${
                    active
                      ? 'bg-[#0a1e3f] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sắp Xếp */}
          <div className="flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setSortMode('TIME')}
              title="Sắp xếp theo thứ tự thời gian trong ngày"
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                sortMode === 'TIME'
                  ? 'bg-slate-100 text-[#0a1e3f]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Theo giờ
            </button>
            <button
              type="button"
              onClick={() => setSortMode('PRIORITY')}
              title="Sắp xếp theo mức độ ưu tiên / Cự ly gần"
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                sortMode === 'PRIORITY'
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-600" />
              Ưu tiên
            </button>
          </div>
        </div>
      </div>

      {/* 4. Danh Sách Các Lịch Hẹn Trong Ngày */}
      {displayedJobs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Không có lịch hẹn nào phù hợp"
          description="Thử đổi bộ lọc hoặc kiểm tra từ khóa tìm kiếm."
          actionLabel="Xem tất cả lịch hẹn hôm nay"
          onAction={() => {
            setFilterMode('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="space-y-3">
          {displayedJobs.map((job, index) => {
            const statusInfo = getStatusDisplay(job.status);
            const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
            const isCompleted = job.status === 'HOAN_THANH';

            return (
              <div
                key={job.id}
                className={`bg-white rounded-3xl border transition-all p-4 sm:p-5 ${
                  job.status === 'DANG_TOI' || job.status === 'DANG_KIEM_TRA'
                    ? 'border-[#0d9488] ring-2 ring-[#0d9488]/15 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Dòng 1: Thứ tự ca + Giờ hẹn + Trạng thái công việc */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                      <span>{job.scheduledTime}</span>
                      <span className="text-slate-400 font-normal ml-1">({job.scheduledDate})</span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bgClass}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Dòng 2: Tóm tắt thông tin khách hàng, Địa chỉ, Loại dịch vụ */}
                <div className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-base leading-tight">
                        {job.customerName}
                      </h4>
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{job.address}, {job.district}</span>
                      </div>
                    </div>

                    {/* Nút bấm nhanh 1 tay: Gọi & Bản đồ */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${job.customerPhone.replace(/\s+/g, '')}`}
                        aria-label={`Gọi khách hàng ${job.customerName}`}
                        className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center active:scale-95 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${job.address}, ${job.district}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở Google Maps chỉ đường đến ${job.customerName}`}
                        className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center active:scale-95 transition-all"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Chi tiết Dịch vụ & Máy móc */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Snowflake className="w-3.5 h-3.5 text-[#0d9488]" />
                        <span>{getServiceTypeName(job.serviceType)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {job.brand} • {job.horsePower} ({job.airconType === 'AM_TRAN' ? 'Âm trần' : 'Treo tường'})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Tạm tính</div>
                      <div className="text-sm font-black text-slate-900">
                        {formatVND(pricing.totalPayable)}
                      </div>
                    </div>
                  </div>

                  {/* Triệu chứng nếu có */}
                  {job.symptoms.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.symptoms.map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md"
                        >
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dòng 3: Thao tác 1 tay theo trạng thái */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    aria-label={`Chi tiết ca ${job.customerName}`}
                    onClick={() => onOpenDetails(job)}
                  >
                    <FileText className="w-4 h-4 mr-1 text-slate-500" />
                    Biên bản ca
                  </Button>

                  {job.status === 'MOI' && (
                    <Button
                      variant="teal"
                      size="md"
                      className="flex-1 font-bold"
                      onClick={() => onQuickAction(job)}
                    >
                      Nhận ca này
                    </Button>
                  )}

                  {job.status === 'DANG_TOI' && (
                    <Button
                      variant="teal"
                      size="md"
                      className="flex-1 font-bold"
                      onClick={() => onQuickAction(job)}
                    >
                      Đã tới nơi
                    </Button>
                  )}

                  {job.status === 'DANG_KIEM_TRA' && (
                    <Button
                      variant="teal"
                      size="md"
                      className="flex-1 font-bold"
                      onClick={() => onOpenDetails(job)}
                    >
                      Lập báo giá
                    </Button>
                  )}

                  {job.status === 'BAO_GIA' && (
                    <Button
                      variant="teal"
                      size="md"
                      className="flex-1 font-bold"
                      onClick={() => onQuickAction(job)}
                    >
                      Khách đã duyệt
                    </Button>
                  )}

                  {job.status === 'DANG_SUA' && (
                    <Button
                      variant="success"
                      size="md"
                      className="flex-1 font-bold"
                      onClick={() => onOpenDetails(job)}
                    >
                      Nghiệm thu
                    </Button>
                  )}

                  {job.status === 'HOAN_THANH' && (
                    <Button
                      variant="outline"
                      size="md"
                      className="flex-1 text-emerald-800 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 font-bold"
                      onClick={() => onOpenInvoice(job)}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1" />
                      Phiếu thu QR
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
