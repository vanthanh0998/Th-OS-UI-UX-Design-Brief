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

// Bảng trạng thái chuẩn hóa theo Section 7 Microcopy
export const STATUS_MAP: Record<JobStatus, StatusMeta> = {
  MOI: {
    status: 'MOI',
    label: 'Chờ tiếp nhận ca',
    shortLabel: 'Chờ nhận ca',
    description: 'Ca làm việc đã được điều phối phân công cho kỹ thuật viên',
    colorClass: 'border-blue-500 bg-blue-50 text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'Chờ nhận ca',
    nextStatus: 'DANG_TOI',
    nextActionLabel: 'Xác nhận & Bấm đang đến',
  },
  DANG_TOI: {
    status: 'DANG_TOI',
    label: 'Thợ đang trên đường đến',
    shortLabel: 'Đang đến',
    description: 'Kỹ thuật viên đã cập nhật thủ công trạng thái di chuyển (ETA-001)',
    colorClass: 'border-amber-500 bg-amber-50 text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Đang đến',
    nextStatus: 'DANG_KIEM_TRA',
    nextActionLabel: 'Đã đến nơi & Bắt đầu kiểm tra',
  },
  DANG_KIEM_TRA: {
    status: 'DANG_KIEM_TRA',
    label: 'Đang kiểm tra kỹ thuật',
    shortLabel: 'Kiểm tra máy',
    description: 'Đang đo ampe kìm, áp gas, nhiệt độ cửa gió và tình trạng máy',
    colorClass: 'border-cyan-500 bg-cyan-50 text-cyan-800',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    badgeText: 'Đang kiểm tra',
    nextStatus: 'BAO_GIA',
    nextActionLabel: 'Lập báo giá theo phiên bản (QUO-001)',
  },
  BAO_GIA: {
    status: 'BAO_GIA',
    label: 'Chờ khách duyệt báo giá',
    shortLabel: 'Chờ duyệt giá',
    description: 'Báo giá đã gửi theo mã Revision bất biến, chờ xác nhận từ khách',
    colorClass: 'border-purple-500 bg-purple-50 text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    badgeText: 'Chờ duyệt giá',
    nextStatus: 'DANG_SUA',
    nextActionLabel: 'Khách duyệt -> Bắt đầu làm',
  },
  DANG_SUA: {
    status: 'DANG_SUA',
    label: 'Đang thực hiện dịch vụ',
    shortLabel: 'Đang làm',
    description: 'Đang tiến hành vệ sinh áp lực, nạp gas hoặc thay thế linh kiện',
    colorClass: 'border-teal-500 bg-teal-50 text-teal-800',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    badgeText: 'Đang làm việc',
    nextStatus: 'HOAN_THANH',
    nextActionLabel: 'Hoàn tất kỹ thuật & Bàn giao',
  },
  HOAN_THANH: {
    status: 'HOAN_THANH',
    label: 'Công việc đã hoàn thành',
    shortLabel: 'Đã hoàn thành',
    description: 'Biên bản kỹ thuật đã nghiệm thu (Thanh toán được ghi nhận riêng qua sổ cái DEC-03)',
    colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'Đã hoàn thành',
  },
  DA_HUY: {
    status: 'DA_HUY',
    label: 'Đã hủy lịch hẹn',
    shortLabel: 'Đã hủy',
    description: 'Lịch hẹn đã bị hủy',
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
  return targetIndex === currentIndex + 1 || (currentIndex === 3 && targetIndex === 2);
}

export function getNextStatus(current: JobStatus): JobStatus | null {
  const currentIndex = ORDERED_STATUSES.indexOf(current);
  if (currentIndex >= 0 && currentIndex < ORDERED_STATUSES.length - 1) {
    return ORDERED_STATUSES[currentIndex + 1];
  }
  return null;
}
