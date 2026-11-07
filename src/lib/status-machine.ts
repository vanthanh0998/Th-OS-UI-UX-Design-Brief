import { Job, JobStatus, Organization, StaffUser } from './types';

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

// Deterministic quotation content hashing (pure, tamper-evident)
export function computeQuotationHash(
  revisionNumber: number,
  items: { description: string; price: number; quantity: number }[],
  total: number,
  createdAt: string
): string {
  const content = JSON.stringify({ revisionNumber, items, total, createdAt });
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const fullHash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(12, '0');
  return `REV${revisionNumber}-${fullHash.substring(0, 8).toUpperCase()}`;
}

// Verification of QUO-001 authorization before moving to DANG_SUA (P0-02: Strictly evaluates LATEST revision only)
export function hasValidQuotationAuthorization(job: Job): boolean {
  if (!job.quotationRevisions || job.quotationRevisions.length === 0) {
    return false;
  }

  // P0-02: ONLY consider the latest active revision
  const latestRev = job.quotationRevisions[job.quotationRevisions.length - 1];
  if (!latestRev) return false;

  if (latestRev.status === 'approved') {
    const isEvidenceValid =
      latestRev.approvedByCustomer === true &&
      Boolean(latestRev.approverName && latestRev.approverName.trim()) &&
      Boolean(latestRev.approvedAt && latestRev.approvedAt.trim()) &&
      Boolean(latestRev.hash && latestRev.hash.trim()) &&
      (!latestRev.approvalEvidence ||
        (latestRev.approvalEvidence.approvedRevisionNumber === latestRev.revisionNumber &&
          latestRev.approvalEvidence.hash === latestRev.hash));
    return isEvidenceValid;
  }

  if (latestRev.status === 'waived') {
    const isWaiverValid =
      latestRev.customerAcknowledged === true &&
      Boolean(latestRev.waiverReason && latestRev.waiverReason.trim().length >= 3);
    return isWaiverValid;
  }

  // Any other status (pending_homeowner, draft, rejected) CANNOT authorize repair
  return false;
}

// P1 Subscription Policy Guard: Write blocks on read_only & suspended tenants
export function canPerformWriteOperation(org: Organization): { allowed: boolean; error?: string } {
  if (org.subscriptionStatus === 'read_only') {
    return {
      allowed: false,
      error: 'Tổ chức đang ở chế độ Chỉ đọc (read_only). Mọi thao tác ghi dữ liệu bị tạm khóa theo chính sách gói.',
    };
  }
  if (org.subscriptionStatus === 'suspended') {
    return {
      allowed: false,
      error: 'Tổ chức đã bị tạm ngưng (suspended). Mọi thao tác ghi dữ liệu bị khóa.',
    };
  }
  return { allowed: true };
}

// P1 Technician Job Scoping: Technicians only see jobs assigned to them (unassigned jobs are hidden from technician)
export function getVisibleJobsForUser(jobs: Job[], user: StaffUser, orgId: string): Job[] {
  const tenantJobs = jobs.filter((j) => j.organizationId === orgId);
  if (user.role === 'technician') {
    return tenantJobs.filter((j) => Boolean(j.assignedTechnicianId && j.assignedTechnicianId === user.id));
  }
  return tenantJobs;
}

export interface TransitionGuardContext {
  job: Job;
  targetStatus: JobStatus;
  currentUser: StaffUser;
  currentOrg: Organization;
}

export interface TransitionValidationResult {
  allowed: boolean;
  code?:
    | 'SUBSCRIPTION_LOCKED'
    | 'TENANT_MISMATCH'
    | 'NOT_ASSIGNED'
    | 'INVALID_TRANSITION'
    | 'QUO_001_REQUIRED'
    | 'ROLE_UNAUTHORIZED';
  error?: string;
}

// Unified Business Transition Guard (P0-02, P0-01, P1)
export function validateJobTransition(context: TransitionGuardContext): TransitionValidationResult {
  const { job, targetStatus, currentUser, currentOrg } = context;

  // 1. Subscription write protection (P1 / DEC-05)
  const writeCheck = canPerformWriteOperation(currentOrg);
  if (!writeCheck.allowed) {
    return {
      allowed: false,
      code: 'SUBSCRIPTION_LOCKED',
      error: writeCheck.error,
    };
  }

  // 2. Multi-tenant isolation: Target job must belong to current active organization
  if (job.organizationId !== currentOrg.id || job.organizationId !== currentUser.organizationId) {
    return {
      allowed: false,
      code: 'TENANT_MISMATCH',
      error: 'Từ chối thao tác: Ca làm việc không thuộc tổ chức hiện tại.',
    };
  }

  // 3. Technician assignment boundary (P1: Reject jobs assigned to others AND unassigned jobs)
  if (currentUser.role === 'technician') {
    if (!job.assignedTechnicianId || job.assignedTechnicianId !== currentUser.id) {
      return {
        allowed: false,
        code: 'NOT_ASSIGNED',
        error: `Từ chối thao tác: Ca #${job.id} ${
          !job.assignedTechnicianId
            ? 'chưa được phân công cho kỹ thuật viên nào (chờ điều phối viên gán thợ).'
            : `không được phân công cho kỹ thuật viên ${currentUser.fullName}.`
        }`,
      };
    }
  }

  // 4. Valid state machine sequence
  if (!canTransitionTo(job.status, targetStatus)) {
    return {
      allowed: false,
      code: 'INVALID_TRANSITION',
      error: `Không thể chuyển trạng thái từ "${STATUS_MAP[job.status].label}" sang "${STATUS_MAP[targetStatus].label}".`,
    };
  }

  // 5. QUO-001 Invariant: Starting repair ('DANG_SUA') strictly requires approved quotation or customer waiver on LATEST revision
  if (targetStatus === 'DANG_SUA') {
    const hasAuth = hasValidQuotationAuthorization(job);
    if (!hasAuth) {
      return {
        allowed: false,
        code: 'QUO_001_REQUIRED',
        error:
          'QUO-001: Không thể bắt đầu sửa chữa nếu chưa có Báo giá được khách hàng duyệt (#REV-xxx) hoặc Biên bản miễn trừ (Waiver) có xác nhận của khách trên phiên bản hiện hành.',
      };
    }
  }

  return { allowed: true };
}

export interface JobMutationContext {
  currentUser: StaffUser;
  currentOrg: Organization;
}

export interface JobMutationResult {
  success: boolean;
  job?: Job;
  error?: string;
  code?: string;
}

// Central Job Mutation Service (P0-03: Single point of mutation protecting against bypasses)
export function mutateJobState(
  currentJob: Job,
  updates: Partial<Job>,
  context: JobMutationContext
): JobMutationResult {
  const { currentUser, currentOrg } = context;

  // 1. Subscription write protection (P1)
  const writeCheck = canPerformWriteOperation(currentOrg);
  if (!writeCheck.allowed) {
    return { success: false, code: 'SUBSCRIPTION_LOCKED', error: writeCheck.error };
  }

  // 2. Multi-tenant isolation
  if (currentJob.organizationId !== currentOrg.id || currentJob.organizationId !== currentUser.organizationId) {
    return { success: false, code: 'TENANT_MISMATCH', error: 'Từ chối thao tác: Ca làm việc không thuộc tổ chức hiện tại.' };
  }
  if (updates.organizationId && updates.organizationId !== currentOrg.id) {
    return { success: false, code: 'TENANT_MISMATCH', error: 'Không thể thay đổi tổ chức của ca làm việc.' };
  }

  // 3. Technician assignment boundary (P1: Reject jobs assigned to others AND unassigned jobs)
  if (currentUser.role === 'technician') {
    if (!currentJob.assignedTechnicianId || currentJob.assignedTechnicianId !== currentUser.id) {
      return {
        success: false,
        code: 'NOT_ASSIGNED',
        error: `Từ chối thao tác: Ca #${currentJob.id} ${
          !currentJob.assignedTechnicianId
            ? 'chưa được phân công cho kỹ thuật viên nào (chờ điều phối viên gán thợ).'
            : `không được phân công cho kỹ thuật viên ${currentUser.fullName}.`
        }`,
      };
    }
    if (updates.assignedTechnicianId && updates.assignedTechnicianId !== currentUser.id) {
      return {
        success: false,
        code: 'ROLE_UNAUTHORIZED',
        error: 'Kỹ thuật viên không có quyền điều phối lại ca cho nhân viên khác.',
      };
    }
  }

  // 4. Status Transition Guard: if status is changing, must pass validateJobTransition
  if (updates.status && updates.status !== currentJob.status) {
    const candidateJob: Job = {
      ...currentJob,
      ...updates,
      status: currentJob.status, // evaluate transition from current status
    };
    const transitionCheck = validateJobTransition({
      job: candidateJob,
      targetStatus: updates.status,
      currentUser,
      currentOrg,
    });
    if (!transitionCheck.allowed) {
      return {
        success: false,
        code: transitionCheck.code,
        error: transitionCheck.error,
      };
    }
  }

  // 5. Construct safely merged and protected job record
  const nextStatus = updates.status || currentJob.status;
  const mergedJob: Job = {
    ...currentJob,
    ...updates,
    id: currentJob.id, // immutable ID
    organizationId: currentJob.organizationId, // immutable tenant
    status: nextStatus,
    completedAt:
      nextStatus === 'HOAN_THANH' ? updates.completedAt || new Date().toISOString() : currentJob.completedAt,
  };

  return { success: true, job: mergedJob };
}
