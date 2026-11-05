import { JobStatus } from './types';

export interface StatusMeta {
  status: JobStatus;
  label: string;
  shortLabel: string;
  description: string;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  nextStatus?: JobStatus;
  nextActionLabel?: string;
}

export const STATUS_MAP: Record<JobStatus, StatusMeta> = {
  MOI: {
    status: 'MOI',
    label: 'Chờ tiếp nhận',
    shortLabel: 'Đơn mới',
    description: 'Khách vừa đặt lịch, cần thợ nhận đơn và chuẩn bị đồ nghề',
    colorClass: 'border-blue-500 bg-blue-50 text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'Đơn Mới',
    nextStatus: 'DANG_TOI',
    nextActionLabel: 'Nhận việc & Xuất phát',
  },
  DANG_TOI: {
    status: 'DANG_TOI',
    label: 'Đang di chuyển',
    shortLabel: 'Đang tới',
    description: 'Thợ đang trên đường đến địa chỉ nhà khách',
    colorClass: 'border-amber-500 bg-amber-50 text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Đang tới',
    nextStatus: 'DANG_KIEM_TRA',
    nextActionLabel: 'Đã tới nơi & Kiểm tra máy',
  },
  DANG_KIEM_TRA: {
    status: 'DANG_KIEM_TRA',
    label: 'Đang kiểm tra máy',
    shortLabel: 'Kiểm tra',
    description: 'Đang đo ampe kìm, áp suất gas, kiểm tra dàn nóng/lạnh',
    colorClass: 'border-cyan-500 bg-cyan-50 text-cyan-800',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    badgeText: 'Đang kiểm tra',
    nextStatus: 'BAO_GIA',
    nextActionLabel: 'Chốt lỗi & Báo giá khách',
  },
  BAO_GIA: {
    status: 'BAO_GIA',
    label: 'Chờ khách duyệt giá',
    shortLabel: 'Báo giá',
    description: 'Đã báo giá chi tiết, chờ khách đồng ý phương án xử lý',
    colorClass: 'border-purple-500 bg-purple-50 text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'Chờ duyệt giá',
    nextStatus: 'DANG_SUA',
    nextActionLabel: 'Khách duyệt -> Bắt đầu làm',
  },
  DANG_SUA: {
    status: 'DANG_SUA',
    label: 'Đang vệ sinh / Sửa chữa',
    shortLabel: 'Đang làm',
    description: 'Đang xịt rửa áp lực cao, thay linh kiện hoặc nạp gas',
    colorClass: 'border-teal-500 bg-teal-50 text-teal-800',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeText: 'Đang làm việc',
    nextStatus: 'HOAN_THANH',
    nextActionLabel: 'Nghiệm thu & Thu tiền',
  },
  HOAN_THANH: {
    status: 'HOAN_THANH',
    label: 'Đã hoàn tất',
    shortLabel: 'Đã xong',
    description: 'Khách đã nghiệm thu độ lạnh, đã thu tiền và kích hoạt bảo hành',
    colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'Hoàn thành',
  },
  DA_HUY: {
    status: 'DA_HUY',
    label: 'Đã hủy',
    shortLabel: 'Hủy',
    description: 'Đơn đã bị hủy theo yêu cầu',
    colorClass: 'border-slate-300 bg-slate-100 text-slate-500',
    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
    badgeText: 'Đã hủy',
  },
};

export const ORDERED_STATUSES: JobStatus[] = [
  'MOI',
  'DANG_TOI',
  'DANG_KIEM_TRA',
  'BAO_GIA',
  'DANG_SUA',
  'HOAN_THANH',
];

export function canTransitionTo(current: JobStatus, target: JobStatus): boolean {
  if (current === target) return true;
  if (current === 'HOAN_THANH' || current === 'DA_HUY') return false;
  if (target === 'DA_HUY') return true;

  const currentIndex = ORDERED_STATUSES.indexOf(current);
  const targetIndex = ORDERED_STATUSES.indexOf(target);

  if (currentIndex === -1 || targetIndex === -1) return false;
  // Cho phép chuyển tiếp tới bước liền kề hoặc quay lại 1 bước để chỉnh sửa báo giá
  return targetIndex === currentIndex + 1 || (currentIndex === 3 && targetIndex === 2);
}

export function getNextStatus(current: JobStatus): JobStatus | null {
  const currentIndex = ORDERED_STATUSES.indexOf(current);
  if (currentIndex >= 0 && currentIndex < ORDERED_STATUSES.length - 1) {
    return ORDERED_STATUSES[currentIndex + 1];
  }
  return null;
}
