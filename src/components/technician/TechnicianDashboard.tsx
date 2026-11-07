import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Wrench,
  Snowflake,
  AlertTriangle,
  Zap,
  Calendar,
  CheckCircle2,
  Receipt,
  Radio,
  FileText,
} from 'lucide-react';
import { Job, JobStatus } from '../../lib/types';
import { calculateJobTotal, formatVND } from '../../lib/pricing';
import { Button } from '../ui/Button';
import {
  MOTION_TIMINGS,
  MOTION_EASINGS,
  buttonPressProps,
  cardPressProps,
} from '../../lib/motion';

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
  const [isSymptomsExpanded, setIsSymptomsExpanded] = useState(false);

  const todayJobs = jobs.filter((j) => j.scheduledDate === 'Hôm nay');
  const inProgressJobs = todayJobs.filter((j) =>
    ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'].includes(j.status)
  );
  const pendingJobs = todayJobs.filter((j) => j.status === 'MOI');
  const completedJobs = todayJobs.filter((j) => j.status === 'HOAN_THANH');

  const totalRevenueToday = todayJobs.reduce((sum, job) => {
    if (job.status === 'DA_HUY') return sum;
    const servicesTotal = job.selectedServices.reduce(
      (s, item) => s + item.price * item.quantity,
      0
    );
    const partsTotal = job.spareParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
    return sum + (servicesTotal + partsTotal);
  }, 0);

  // Spotlight Next Job: Ca đang thực hiện hoặc ca đầu tiên trong hàng đợi
  const spotlightJob = inProgressJobs[0] || pendingJobs[0] || todayJobs[0];

  // Các ca còn lại (không bao gồm ca spotlight nếu có ca spotlight)
  const subsequentJobs = todayJobs.filter((j) => !spotlightJob || j.id !== spotlightJob.id);

  const displayedJobs = subsequentJobs.filter((job) => {
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

  const getStatusHumanLabel = (status: JobStatus) => {
    switch (status) {
      case 'MOI':
        return { label: 'Chờ nhận ca', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'DANG_TOI':
        return { label: 'Đang đến nơi', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'DANG_KIEM_TRA':
        return { label: 'Đang kiểm tra', bg: 'bg-teal-100 text-teal-900 border-teal-300' };
      case 'BAO_GIA':
        return { label: 'Chờ duyệt giá', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
      case 'DANG_SUA':
        return { label: 'Đang sửa chữa', bg: 'bg-teal-100 text-teal-900 border-teal-300' };
      case 'HOAN_THANH':
        return { label: 'Đã hoàn tất', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'DA_HUY':
        return { label: 'Đã hủy', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300' };
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
        return 'Xem sổ cái thu tiền';
      default:
        return 'Chi tiết ca';
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20 sm:pb-8">
      {/* 1. COMPACT SHIFT GREETING & OPERATIONAL METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Lịch trực Hiện trường
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sẵn sàng
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 mt-0.5">
            <span className="font-medium">Kỹ thuật viên: <strong className="text-slate-800">{technicianName}</strong></span>
            <span className="text-slate-300">·</span>
            <span className="font-bold text-slate-800">{todayJobs.length} ca hôm nay</span>
            <span className="text-slate-300">·</span>
            <span>Doanh số tạm tính:</span>
            <strong className="font-mono text-teal-800 font-bold">{formatVND(totalRevenueToday)}</strong>
          </div>
        </div>

        <Button
          variant="teal"
          size="md"
          onClick={onCreateJobRequest}
          className="self-start sm:self-auto flex items-center gap-1.5 shadow-xs font-bold text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 shrink-0 whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Đặt lịch hẹn</span>
        </Button>
      </div>

      {/* 2. SPOTLIGHT HERO: CA ƯU TIÊN SỐ 1 XỬ LÝ NGAY (Optimized Height for 390x844 Viewport) */}
      {spotlightJob ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION_TIMINGS.normal, ease: MOTION_EASINGS.natural }}
          className="bg-[#0a1e3f] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 relative overflow-hidden"
        >
          {/* Top Priority Header Bar */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              <span className="text-xs font-black text-teal-300 uppercase tracking-wider">
                Ca ưu tiên xử lý ngay
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                getStatusHumanLabel(spotlightJob.status).bg
              }`}
            >
              {getStatusHumanLabel(spotlightJob.status).label}
            </span>
          </div>

          {/* Hero Content (Compact & Ergonomic) */}
          <div className="py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {spotlightJob.customerName}
              </h2>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-mono font-bold text-teal-300 bg-white/10 px-2.5 py-1 rounded-lg shrink-0 border border-white/10 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{spotlightJob.scheduledTime}</span>
              </div>
            </div>

            {/* Address & Building Access */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-200 truncate">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="font-medium truncate">
                {spotlightJob.address}, {spotlightJob.district}
              </span>
            </div>

            {spotlightJob.customerNotes && (
              <div className="text-xs text-amber-200 bg-amber-500/15 px-2.5 py-1.5 rounded-lg border border-amber-500/30 font-medium">
                <span className="font-bold">Lưu ý:</span> {spotlightJob.customerNotes}
              </div>
            )}

            {/* Equipment & Problem Callout with Expandable Symptoms */}
            <div className="pt-0.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md shrink-0">
                    {spotlightJob.brand} {spotlightJob.horsePower}
                  </span>
                  {spotlightJob.symptoms.length > 0 && !isSymptomsExpanded && (
                    <span className="text-rose-200 bg-rose-500/20 px-2 py-0.5 rounded-md font-semibold truncate border border-rose-500/30 max-w-[200px] sm:max-w-md">
                      {spotlightJob.symptoms.join(', ')}
                    </span>
                  )}
                </div>

                {spotlightJob.symptoms.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSymptomsExpanded((prev) => !prev)}
                    className="text-[11px] font-bold text-teal-300 hover:text-teal-200 flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 shrink-0 transition-colors"
                  >
                    <span>{isSymptomsExpanded ? 'Thu gọn' : '+ Xem chi tiết lỗi'}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isSymptomsExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Expandable Full Symptom Dossier (No data loss or truncation) */}
              <AnimatePresence>
                {isSymptomsExpanded && spotlightJob.symptoms.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: MOTION_TIMINGS.fast, ease: MOTION_EASINGS.natural }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2 mt-1">
                      <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Mô tả triệu chứng hư hỏng báo trước</span>
                      </div>
                      <div className="space-y-1.5">
                        {spotlightJob.symptoms.map((symptom, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-rose-100 bg-rose-500/15 p-2 rounded-lg border border-rose-500/25"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                            <span className="font-medium leading-relaxed">{symptom}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Ergonomic Touch-Zone Action Buttons (Height 44px, Thumb-Zone >= 44-48px) */}
          <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <motion.a
              {...buttonPressProps}
              href={`tel:${spotlightJob.customerPhone.replace(/\s+/g, '')}`}
              className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap shrink-0 min-h-[44px]"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Gọi khách</span>
            </motion.a>

            <motion.a
              {...buttonPressProps}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${spotlightJob.address}, ${spotlightJob.district}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/15 transition-all whitespace-nowrap shrink-0 min-h-[44px]"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Chỉ đường</span>
            </motion.a>

            <motion.button
              {...buttonPressProps}
              type="button"
              onClick={() => {
                if (spotlightJob.status === 'HOAN_THANH') {
                  onOpenInvoice(spotlightJob);
                } else {
                  onQuickAction(spotlightJob);
                }
              }}
              className="col-span-2 sm:col-span-1 h-11 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition-all whitespace-nowrap min-h-[44px]"
            >
              <Zap className="w-4 h-4 text-slate-950 shrink-0" />
              <span>{getNextActionLabel(spotlightJob.status)}</span>
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          Hôm nay chưa có ca làm việc nào được phân công.
        </div>
      )}

      {/* 3. SUBSEQUENT JOBS QUEUE (HÀNG ĐỢI CA KẾ TIẾP) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Các ca tiếp theo trong ngày ({displayedJobs.length})
          </h2>
          <span className="text-xs text-slate-400">Thứ tự ưu tiên theo lịch hẹn</span>
        </div>

        {displayedJobs.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            Không có ca công việc nào khác trong hàng đợi hôm nay.
          </div>
        ) : (
          displayedJobs.map((job, idx) => {
            const pricing = calculateJobTotal(job.selectedServices, job.spareParts, job.discount);
            const statusMeta = getStatusHumanLabel(job.status);
            const queueOrder = idx + 2;

            return (
              <motion.div
                key={job.id}
                {...cardPressProps}
                onClick={() => onOpenDetails(job)}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Queue number badge */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200/80">
                      #{queueOrder}
                    </div>

                    {/* Customer & Location & Time */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base truncate">
                          {job.customerName}
                        </span>
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/40">
                          {job.scheduledTime}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusMeta.bg}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 truncate mt-1">
                        {job.address}, {job.district} • {job.brand} {job.horsePower}
                      </div>
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="hidden sm:block text-right">
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {formatVND(pricing.totalPayable)}
                      </div>
                      <div className="text-[11px] text-slate-400">Tạm tính</div>
                    </div>

                    <motion.a
                      whileTap={{ scale: 0.92 }}
                      href={`tel:${job.customerPhone.replace(/\s+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 flex items-center justify-center border border-emerald-200/70 transition-colors shadow-xs shrink-0"
                      title="Gọi điện nhanh"
                    >
                      <Phone className="w-4 h-4" />
                    </motion.a>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
