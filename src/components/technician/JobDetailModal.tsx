import React, { useState } from 'react';
import {
  Phone,
  Navigation,
  Copy,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Wrench,
  Camera,
  QrCode,
  DollarSign,
  ShieldCheck,
  Thermometer,
  Gauge,
  Zap,
  ArrowRight,
  FileText,
  Lock,
  Unlock,
  Check,
  History,
} from 'lucide-react';
import { Job, JobStatus, SparePartItem, StaffUser, Organization, QuotationRevision } from '../../lib/types';
import {
  ORDERED_STATUSES,
  STATUS_MAP,
  canTransitionTo,
  validateJobTransition,
  hasValidQuotationAuthorization,
  computeQuotationHash,
} from '../../lib/status-machine';
import { COMMON_SPARE_PARTS, calculateJobTotal, formatVND } from '../../lib/pricing';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateJob: (updatedJob: Job) => void;
  onOpenInvoice: (job: Job) => void;
  currentUser?: StaffUser;
  currentOrg?: Organization;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateJob,
  onOpenInvoice,
  currentUser,
  currentOrg,
}) => {
  if (!job) return null;

  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'CHECKLIST' | 'QUOTATION' | 'PHOTOS'>('WORKFLOW');
  const [copied, setCopied] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [guardError, setGuardError] = useState<string | null>(null);

  // QUO-001 Approval / Waiver Form States
  const [approverName, setApproverName] = useState(job.customerName || '');
  const [customerApprovedCheck, setCustomerApprovedCheck] = useState(false);
  const [waiverReason, setWaiverReason] = useState(
    'Bảo trì vệ sinh điều hòa định kỳ theo giá niêm yết chuẩn, không phát sinh linh kiện thay thế.'
  );
  const [customerWaiverCheck, setCustomerWaiverCheck] = useState(false);
  const [showWaiverForm, setShowWaiverForm] = useState(false);

  // Editable fields local state
  const [checklist, setChecklist] = useState(job.checklist);
  const [spareParts, setSpareParts] = useState<SparePartItem[]>(job.spareParts || []);
  const [discount, setDiscount] = useState<number>(job.discount || 0);

  const pricing = calculateJobTotal(job.selectedServices, spareParts, discount);
  const isAuthorizedForRepair = hasValidQuotationAuthorization(job);
  const latestRevision: QuotationRevision | undefined =
    job.quotationRevisions && job.quotationRevisions.length > 0
      ? job.quotationRevisions[job.quotationRevisions.length - 1]
      : undefined;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${job.address}, ${job.district}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusTransition = (nextStatus: JobStatus) => {
    setGuardError(null);

    // Business Transition Guard (P0-02, P0-01, P1)
    if (currentUser && currentOrg) {
      const validation = validateJobTransition({
        job: { ...job, checklist, spareParts, discount },
        targetStatus: nextStatus,
        currentUser,
        currentOrg,
      });

      if (!validation.allowed) {
        setGuardError(validation.error || 'Thao tác chuyển trạng thái bị chặn bởi chính sách nghiệp vụ.');
        if (validation.code === 'QUO_001_REQUIRED') {
          setActiveTab('QUOTATION');
        }
        return;
      }
    } else if (!canTransitionTo(job.status, nextStatus)) {
      setGuardError('Thứ tự trạng thái không hợp lệ.');
      return;
    }

    const updated: Job = {
      ...job,
      status: nextStatus,
      checklist,
      spareParts,
      discount,
      completedAt: nextStatus === 'HOAN_THANH' ? new Date().toISOString() : job.completedAt,
    };
    onUpdateJob(updated);
  };

  const handleSaveChecklist = () => {
    const updated: Job = {
      ...job,
      checklist,
      spareParts,
      discount,
    };
    onUpdateJob(updated);
    setApprovalNotice('Đã lưu biên bản kỹ thuật.');
    setTimeout(() => setApprovalNotice(null), 2500);
  };

  const handleAddSparePart = () => {
    if (!selectedPartId) return;
    const template = COMMON_SPARE_PARTS.find((p) => p.id === selectedPartId);
    if (!template) return;

    const existingIndex = spareParts.findIndex((p) => p.id === template.id);
    let updated: SparePartItem[];
    if (existingIndex >= 0) {
      updated = [...spareParts];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [...spareParts, { ...template, quantity: 1 }];
    }
    setSpareParts(updated);
    setSelectedPartId('');
    onUpdateJob({ ...job, spareParts: updated });
  };

  const handleRemoveSparePart = (id: string) => {
    const updated = spareParts.filter((p) => p.id !== id);
    setSpareParts(updated);
    onUpdateJob({ ...job, spareParts: updated });
  };

  // QUO-001 Step 1: Create deterministic snapshot revision & submit for homeowner review
  const handleCreateAndSendRevision = () => {
    setGuardError(null);
    const revNumber = (job.quotationRevisions?.length || 0) + 1;
    const now = new Date().toISOString();

    const snapshotItems = [
      ...job.selectedServices.map((s) => ({
        description: s.serviceId,
        price: s.price,
        quantity: s.quantity,
      })),
      ...spareParts.map((p) => ({
        description: `${p.name} (Bảo hành ${p.warrantyMonths} tháng)`,
        price: p.unitPrice,
        quantity: p.quantity,
      })),
    ];

    const hash = computeQuotationHash(revNumber, snapshotItems, pricing.totalPayable, now);

    const newRevision: QuotationRevision = {
      revisionNumber: revNumber,
      hash,
      items: snapshotItems,
      subtotal: pricing.subtotalServices + pricing.subtotalParts,
      discount: pricing.discountAmount,
      total: pricing.totalPayable,
      status: 'pending_homeowner', // Immutable snapshot awaiting customer confirmation
      createdAt: now,
    };

    const updatedJob: Job = {
      ...job,
      status: 'BAO_GIA',
      spareParts,
      discount,
      quotationRevisions: [...(job.quotationRevisions || []), newRevision],
    };

    onUpdateJob(updatedJob);
    setApprovalNotice(`Đã lập Báo giá ${hash} và chuyển trạng thái Chờ duyệt giá.`);
    setTimeout(() => setApprovalNotice(null), 3500);
  };

  // QUO-001 Step 2: Record verified customer approval evidence
  const handleConfirmCustomerApproval = (revNumber: number) => {
    if (!customerApprovedCheck) {
      setGuardError('Vui lòng xác nhận khách hàng đã đồng ý nội dung báo giá.');
      return;
    }
    if (!approverName.trim()) {
      setGuardError('Vui lòng nhập tên người xác nhận phê duyệt (khách hàng hoặc đại diện).');
      return;
    }

    const now = new Date().toISOString();
    const updatedRevisions = (job.quotationRevisions || []).map((rev) => {
      if (rev.revisionNumber === revNumber) {
        return {
          ...rev,
          status: 'approved' as const,
          approvedByCustomer: true,
          approverName: approverName.trim(),
          approvedAt: now,
          approvalEvidence: {
            approvedByCustomer: true,
            approverName: approverName.trim(),
            approvedAt: now,
            approvedRevisionNumber: revNumber,
            hash: rev.hash,
            notes: 'Khách hàng xác nhận đồng ý trực tiếp / bằng văn bản',
          },
        };
      }
      return rev;
    });

    const updatedJob: Job = {
      ...job,
      quotationRevisions: updatedRevisions,
    };

    onUpdateJob(updatedJob);
    setGuardError(null);
    setApprovalNotice(`Đã ghi nhận bằng chứng khách hàng ký duyệt #${revNumber}! Có thể bắt đầu sửa chữa.`);
    setTimeout(() => setApprovalNotice(null), 3500);
  };

  // QUO-001 Step 3: Record valid quotation waiver evidence
  const handleConfirmQuotationWaiver = () => {
    if (!customerWaiverCheck) {
      setGuardError('Vui lòng tích xác nhận khách hàng đã đồng ý miễn trừ lập báo giá.');
      return;
    }
    if (!waiverReason.trim() || waiverReason.trim().length < 5) {
      setGuardError('Vui lòng nhập lý do miễn trừ báo giá rõ ràng (tối thiểu 5 ký tự).');
      return;
    }

    const revNumber = (job.quotationRevisions?.length || 0) + 1;
    const now = new Date().toISOString();

    const snapshotItems = job.selectedServices.map((s) => ({
      description: s.serviceId,
      price: s.price,
      quantity: s.quantity,
    }));

    const waiverRevision: QuotationRevision = {
      revisionNumber: revNumber,
      hash: `WAIVER-${revNumber}`,
      items: snapshotItems,
      subtotal: pricing.subtotalServices,
      discount: 0,
      total: pricing.totalPayable,
      status: 'waived',
      waiverReason: waiverReason.trim(),
      customerAcknowledged: true,
      createdAt: now,
      approvedAt: now,
      waiverEvidence: {
        waived: true,
        waiverReason: waiverReason.trim(),
        customerAcknowledged: true,
        waivedAt: now,
        waivedBy: currentUser?.fullName || 'Kỹ thuật viên',
      },
    };

    const updatedJob: Job = {
      ...job,
      quotationRevisions: [...(job.quotationRevisions || []), waiverRevision],
    };

    onUpdateJob(updatedJob);
    setShowWaiverForm(false);
    setGuardError(null);
    setApprovalNotice('Đã ghi nhận Biên bản miễn trừ báo giá hợp lệ! Đủ điều kiện bắt đầu sửa chữa.');
    setTimeout(() => setApprovalNotice(null), 3500);
  };

  const handleAddDemoPhoto = (type: 'before' | 'after') => {
    const demoPhotos = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23e2e8f0"/><text x="50%" y="50%" font-size="13" font-family="sans-serif" font-weight="bold" fill="%23475569" dominant-baseline="middle" text-anchor="middle">Ảnh hiện trạng máy lạnh</text></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23ccfbf1"/><text x="50%" y="50%" font-size="13" font-family="sans-serif" font-weight="bold" fill="%230f766e" dominant-baseline="middle" text-anchor="middle">Ảnh sau khi vệ sinh nghiệm thu</text></svg>',
    ];
    const chosen = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
    if (type === 'before') {
      const updatedPhotos = [...job.photosBefore, chosen];
      onUpdateJob({ ...job, photosBefore: updatedPhotos });
    } else {
      const updatedPhotos = [...job.photosAfter, chosen];
      onUpdateJob({ ...job, photosAfter: updatedPhotos });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi Tiết Ca #${job.id}`}
      subtitle={`${job.brand} • ${job.horsePower} (${job.scheduledTime})`}
      maxWidth="lg"
    >
      {/* Guard Error Banner if Active */}
      {guardError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Chặn chuyển trạng thái:</div>
            <div>{guardError}</div>
          </div>
          <button
            type="button"
            onClick={() => setGuardError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Approval Success Notification */}
      {approvalNotice && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fadeIn font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{approvalNotice}</span>
        </div>
      )}

      {/* Status Progress Stepper */}
      <div className="mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-600">Tiến trình làm việc:</span>
          <span className="text-[#0d9488] font-bold">{STATUS_MAP[job.status].label}</span>
        </div>
        <div className="grid grid-cols-6 gap-1 relative">
          {ORDERED_STATUSES.map((st, index) => {
            const currentIdx = ORDERED_STATUSES.indexOf(job.status);
            const isCompleted = index < currentIdx;
            const isCurrent = index === currentIdx;

            return (
              <div key={st} className="flex flex-col items-center text-center">
                <div
                  className={`w-full h-1.5 rounded-full mb-1 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-[#0d9488]'
                      : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`text-[10px] leading-tight font-medium ${
                    isCurrent
                      ? 'text-[#0d9488] font-bold'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {STATUS_MAP[st].shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Quick Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-900 text-base">{job.customerName}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <span>{job.customerPhone}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold">{job.district}</span>
            </div>
            <p className="text-xs text-slate-700 mt-1.5 leading-snug">
              {job.address}, {job.district}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${job.customerPhone.replace(/\s+/g, '')}`}
              aria-label="Gọi điện thoại cho khách"
              className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold"
            >
              <Phone className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={handleCopyAddress}
              aria-label="Sao chép địa chỉ"
              className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        {copied && (
          <p className="text-[11px] text-emerald-600 font-medium mt-2">
            Đã chép địa chỉ vào bộ nhớ tạm!
          </p>
        )}
        {job.customerNotes && (
          <div className="mt-3 text-xs bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-xl text-amber-900">
            <span className="font-bold">Lưu ý của khách: </span>
            {job.customerNotes}
          </div>
        )}
      </div>

      {/* Workspace Tabs for Technician */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-4 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('WORKFLOW')}
          className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'WORKFLOW'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trạng thái & Thao tác
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CHECKLIST')}
          className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'CHECKLIST'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Đo đạc & Kỹ thuật
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('QUOTATION')}
          className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'QUOTATION'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Báo giá & Phụ tùng</span>
          {isAuthorizedForRepair && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã có duyệt giá / waiver hợp lệ" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PHOTOS')}
          className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'PHOTOS'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Ảnh ({job.photosBefore.length + job.photosAfter.length})
        </button>
      </div>

      {/* TAB 1: WORKFLOW */}
      {activeTab === 'WORKFLOW' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h5 className="font-bold text-slate-900 text-sm mb-1">Thao tác chuyển trạng thái:</h5>
            <p className="text-xs text-slate-500 mb-3">
              Chạm vào nút để cập nhật bước thực hiện tiếp theo:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {job.status === 'MOI' && (
                <Button
                  variant="teal"
                  size="lg"
                  fullWidth
                  onClick={() => handleStatusTransition('DANG_TOI')}
                >
                  <Navigation className="w-5 h-5 mr-1" />
                  Nhận ca & Bấm đang đến (ETA-001)
                </Button>
              )}

              {job.status === 'DANG_TOI' && (
                <Button
                  variant="teal"
                  size="lg"
                  fullWidth
                  onClick={() => handleStatusTransition('DANG_KIEM_TRA')}
                >
                  <Wrench className="w-5 h-5 mr-1" />
                  Đã đến nơi & Bắt đầu kiểm tra máy
                </Button>
              )}

              {job.status === 'DANG_KIEM_TRA' && (
                <div className="space-y-2">
                  <Button
                    variant="teal"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      handleStatusTransition('BAO_GIA');
                      setActiveTab('QUOTATION');
                    }}
                  >
                    <FileText className="w-5 h-5 mr-1" />
                    Lập bảng báo giá chi tiết (QUO-001)
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setActiveTab('QUOTATION');
                      setShowWaiverForm(true);
                    }}
                  >
                    Không phát sinh linh kiện &rarr; Lập biên bản miễn trừ (Waiver)
                  </Button>
                </div>
              )}

              {job.status === 'BAO_GIA' && (
                <div className="space-y-2.5">
                  {isAuthorizedForRepair ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Đã có phê duyệt hợp lệ (QUO-001):</span>
                        </span>
                        <span className="font-mono text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">
                          {latestRevision?.hash || 'XÁC NHẬN'}
                        </span>
                      </div>
                      <div className="text-emerald-800 text-[11px]">
                        Người duyệt: <strong>{latestRevision?.approverName || latestRevision?.waiverReason}</strong>
                      </div>
                      <Button
                        variant="teal"
                        size="lg"
                        fullWidth
                        onClick={() => handleStatusTransition('DANG_SUA')}
                        className="mt-2"
                      >
                        <Unlock className="w-4 h-4 mr-1.5" />
                        Bắt đầu thực hiện dịch vụ & sửa chữa
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold">
                        <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Chờ khách duyệt báo giá hoặc lập biên bản miễn trừ (QUO-001)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Chính sách kỹ thuật ThợOS yêu cầu khách hàng xác nhận chi phí trước khi thợ thao tác sửa chữa.
                      </p>
                      <Button
                        variant="teal"
                        size="md"
                        fullWidth
                        onClick={() => setActiveTab('QUOTATION')}
                      >
                        Chuyển sang tab Báo giá để duyệt hoặc miễn trừ
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {job.status === 'DANG_SUA' && (
                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    handleStatusTransition('HOAN_THANH');
                    onOpenInvoice(job);
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 mr-1" />
                  Xong việc &rarr; Nghiệm thu & Xuất phiếu thu
                </Button>
              )}

              {job.status === 'HOAN_THANH' && (
                <Button
                  variant="navy"
                  size="lg"
                  fullWidth
                  onClick={() => onOpenInvoice(job)}
                >
                  <QrCode className="w-5 h-5 mr-1" />
                  Mở Mã QR Thanh Toán & Phiếu Bảo Hành
                </Button>
              )}
            </div>
          </div>

          {/* Quick Pricing Glance */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Tổng tiền dự kiến theo dịch vụ:</div>
              <div className="text-xl font-black text-[#14b8a6]">
                {formatVND(pricing.totalPayable)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-teal-300 bg-teal-900/50 px-2 py-1 rounded border border-teal-500/30">
                Thanh toán qua Sổ Cái (DEC-03)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL CHECKLIST */}
      {activeTab === 'CHECKLIST' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Dòng tải (Ampe)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 4.5"
                value={checklist.electricCurrentAmps || ''}
                onChange={(e) =>
                  setChecklist({ ...checklist, electricCurrentAmps: parseFloat(e.target.value) || undefined })
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Chuẩn: 3.5 - 6.5A</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Gauge className="w-3.5 h-3.5 text-blue-500" />
                Áp suất Gas (PSI)
              </label>
              <input
                type="number"
                placeholder="VD: 140"
                value={checklist.gasPressurePsi || ''}
                onChange={(e) =>
                  setChecklist({ ...checklist, gasPressurePsi: parseFloat(e.target.value) || undefined })
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">R32/R410A: 120-150 PSI</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-cyan-500" />
                Nhiệt độ cửa gió (°C)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="VD: 12.5"
                value={checklist.tempColdAirC || ''}
                onChange={(e) =>
                  setChecklist({ ...checklist, tempColdAirC: parseFloat(e.target.value) || undefined })
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Lạnh tốt: 10 - 14°C</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Hạng mục kiểm tra bắt buộc:
            </h5>

            {[
              { key: 'drainPipeCleared', label: 'Đã thông máng xối và ống thoát nước thải' },
              { key: 'filterCleaned', label: 'Đã xịt rửa lưới lọc bụi và dàn lạnh bằng bơm áp lực' },
              { key: 'outdoorCoilCleaned', label: 'Dàn nóng sạch bụi, giải nhiệt thông thoáng' },
              { key: 'electricalTightened', label: 'Đã siết ốc đầu cốt điện, kiểm tra tụ khởi động' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 text-xs font-medium text-slate-800"
              >
                <input
                  type="checkbox"
                  checked={(checklist as any)[item.key] || false}
                  onChange={(e) =>
                    setChecklist({ ...checklist, [item.key]: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]"
                />
                <span>{item.label}</span>
              </label>
            ))}

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Ghi chú kỹ thuật của thợ:
              </label>
              <textarea
                rows={2}
                value={checklist.notes || ''}
                onChange={(e) => setChecklist({ ...checklist, notes: e.target.value })}
                placeholder="VD: Cánh quạt dàn lạnh có dấu hiệu hơi mòn trục, đã tra dầu silicon..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
            </div>
          </div>

          <Button variant="teal" size="md" fullWidth onClick={handleSaveChecklist}>
            Lưu biên bản đo đạc
          </Button>
        </div>
      )}

      {/* TAB 3: QUOTATION & SPARE PARTS (QUO-001 Compliant) */}
      {activeTab === 'QUOTATION' && (
        <div className="space-y-4">
          {/* QUO-001 Authorization Status Badge Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              isAuthorizedForRepair
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAuthorizedForRepair ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {isAuthorizedForRepair
                    ? 'Báo giá đã được khách hàng phê duyệt (QUO-001 Đạt)'
                    : 'Chưa có bằng chứng duyệt báo giá (Khóa bước sửa chữa)'}
                </div>
                <div className="text-[11px] opacity-90">
                  {isAuthorizedForRepair
                    ? `Mã xác thực: ${latestRevision?.hash} • Người duyệt: ${latestRevision?.approverName || 'Khách hàng'}`
                    : 'Cần gửi báo giá cho khách duyệt hoặc xác nhận biên bản miễn trừ'}
                </div>
              </div>
            </div>
            {isAuthorizedForRepair && (
              <Badge variant="success">Đủ điều kiện</Badge>
            )}
          </div>

          {/* Add Spare Parts Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h5 className="font-bold text-slate-900 text-sm mb-2">Thêm linh kiện / Vật tư phát sinh:</h5>
            <div className="flex gap-2">
              <select
                aria-label="Chọn linh kiện thay thế"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="flex-1 h-11 px-3 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              >
                <option value="">-- Chọn linh kiện thay thế --</option>
                {COMMON_SPARE_PARTS.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.name} - {formatVND(part.unitPrice)}
                  </option>
                ))}
              </select>
              <Button
                variant="teal"
                size="md"
                onClick={handleAddSparePart}
                disabled={!selectedPartId}
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm
              </Button>
            </div>
          </div>

          {/* Spare Parts List */}
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <div className="p-3 bg-slate-50 text-xs font-bold text-slate-700 flex justify-between">
              <span>Hạng mục phát sinh</span>
              <span>Đơn giá & Thao tác</span>
            </div>
            {spareParts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Chưa có linh kiện phát sinh nào.
              </div>
            ) : (
              spareParts.map((part) => (
                <div key={part.id} className="p-3 flex items-center justify-between text-xs gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">{part.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Bảo hành {part.warrantyMonths} tháng • SL: {part.quantity} {part.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {formatVND(part.unitPrice * part.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSparePart(part.id)}
                      aria-label={`Xóa ${part.name}`}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Calculation Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Công dịch vụ cơ sở:</span>
              <span className="font-semibold text-slate-900">{formatVND(pricing.subtotalServices)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Linh kiện phát sinh:</span>
              <span className="font-semibold text-slate-900">{formatVND(pricing.subtotalParts)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200">
              <span className="text-slate-600 font-medium">Giảm giá / Ưu đãi (VND):</span>
              <input
                type="number"
                step="10000"
                value={discount}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setDiscount(val);
                  onUpdateJob({ ...job, discount: val });
                }}
                className="w-28 h-8 px-2 text-right rounded-lg border border-slate-200 bg-white font-bold text-rose-600"
              />
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Tổng thanh toán báo giá:</span>
              <span className="text-base text-[#0d9488] font-black">{formatVND(pricing.totalPayable)}</span>
            </div>
          </div>

          {/* QUO-001 Action Form 1: Generate & Send Revision Snapshot */}
          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>1. Lập Snapshot Báo giá Bất biến (#REV)</span>
              </span>
              <span className="text-[11px] font-mono text-teal-800 bg-teal-100 px-2 py-0.5 rounded font-bold">
                Rev {(job.quotationRevisions?.length || 0) + 1}
              </span>
            </div>
            <p className="text-[11px] text-teal-800 leading-snug">
              Tạo phiên bản báo giá với băm nội dung xác thực (hash). Khách hàng sẽ xem và ký duyệt trước khi chuyển sang bước sửa chữa.
            </p>
            <Button
              variant="teal"
              size="md"
              fullWidth
              onClick={handleCreateAndSendRevision}
            >
              Lập Báo giá & Gửi khách duyệt (#REV-00{(job.quotationRevisions?.length || 0) + 1})
            </Button>
          </div>

          {/* QUO-001 Action Form 2: Customer Approval Evidence Recording */}
          {latestRevision && latestRevision.status === 'pending_homeowner' && (
            <div className="p-4 bg-white rounded-2xl border-2 border-teal-500 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>2. Ghi nhận Bằng chứng Khách hàng Duyệt giá</span>
                </span>
                <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                  {latestRevision.hash}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Họ tên khách hàng / Người xác nhận duyệt chi phí:
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full h-10 px-3 text-xs bg-slate-50 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerApprovedCheck}
                  onChange={(e) => setCustomerApprovedCheck(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-[#0d9488] focus:ring-[#0d9488]"
                />
                <span className="text-xs text-slate-800 leading-snug">
                  Tôi xác nhận <strong>khách hàng đã xem chi tiết báo giá ({formatVND(latestRevision.total)})</strong> và đồng ý để thợ tiến hành dịch vụ.
                </span>
              </label>

              <Button
                variant="success"
                size="md"
                fullWidth
                disabled={!customerApprovedCheck || !approverName.trim()}
                onClick={() => handleConfirmCustomerApproval(latestRevision.revisionNumber)}
              >
                <Check className="w-4 h-4 mr-1.5" />
                Lưu Bằng chứng Duyệt & Kích hoạt Quyền sửa chữa
              </Button>
            </div>
          )}

          {/* QUO-001 Action Form 3: Customer Quotation Waiver Option */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Hoặc: Biên bản Miễn trừ Báo giá (Quotation Waiver)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowWaiverForm(!showWaiverForm)}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                {showWaiverForm ? 'Ẩn form waiver' : 'Lập waiver'}
              </button>
            </div>

            {showWaiverForm && (
              <div className="space-y-3 pt-2 border-t border-slate-200 animate-fadeIn">
                <p className="text-[11px] text-slate-600">
                  Áp dụng khi ca làm việc là bảo dưỡng tiêu chuẩn theo giá niêm yết cố định, dịch vụ trọn gói hoặc ca khẩn cấp đã được khách đồng ý miệng.
                </p>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Lý do miễn trừ lập báo giá:
                  </label>
                  <input
                    type="text"
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    placeholder="VD: Khách yêu cầu vệ sinh tiêu chuẩn theo bảng giá cố định"
                    className="w-full h-10 px-3 text-xs bg-white rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  />
                </div>

                <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerWaiverCheck}
                    onChange={(e) => setCustomerWaiverCheck(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#0d9488] focus:ring-[#0d9488]"
                  />
                  <span className="text-xs text-slate-800 leading-snug">
                    Khách hàng đã đồng ý miễn trừ bảng báo giá chi tiết và chỉ thanh toán theo đơn giá dịch vụ đã thỏa thuận.
                  </span>
                </label>

                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  disabled={!customerWaiverCheck || !waiverReason.trim()}
                  onClick={handleConfirmQuotationWaiver}
                >
                  Xác nhận Miễn trừ (Waiver Confirmed)
                </Button>
              </div>
            )}
          </div>

          {/* Quotation History Audit Trail */}
          {job.quotationRevisions && job.quotationRevisions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <History className="w-4 h-4 text-slate-500" />
                <span>Lịch sử các phiên bản báo giá (#REV Audit Log):</span>
              </div>
              <div className="divide-y divide-slate-100">
                {job.quotationRevisions.map((rev) => (
                  <div key={rev.revisionNumber} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">Rev #{rev.revisionNumber}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {rev.hash}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rev.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rev.status === 'waived'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rev.status === 'approved'
                            ? 'Đã duyệt'
                            : rev.status === 'waived'
                            ? 'Miễn trừ'
                            : 'Chờ duyệt'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {rev.status === 'approved' && `Duyệt bởi: ${rev.approverName} lúc ${new Date(rev.approvedAt || rev.createdAt).toLocaleTimeString('vi-VN')}`}
                        {rev.status === 'waived' && `Lý do: ${rev.waiverReason}`}
                        {rev.status === 'pending_homeowner' && 'Đã gửi khách chờ phản hồi'}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 text-right">
                      {formatVND(rev.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PHOTOS */}
      {activeTab === 'PHOTOS' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs uppercase">Ảnh trước khi làm (Hiện trạng):</h5>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddDemoPhoto('before')}
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                Chụp ảnh
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {job.photosBefore.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có ảnh trước khi vệ sinh / sửa.
                </div>
              ) : (
                job.photosBefore.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Hiện trạng máy lạnh"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200"
                  />
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-slate-900 text-xs uppercase">Ảnh sau khi hoàn thành (Nghiệm thu):</h5>
              <Button
                variant="teal"
                size="sm"
                onClick={() => handleAddDemoPhoto('after')}
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                Chụp ảnh sạch sẽ
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {job.photosAfter.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa có ảnh sau khi hoàn thành.
                </div>
              ) : (
                job.photosAfter.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Sau khi làm sạch"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
