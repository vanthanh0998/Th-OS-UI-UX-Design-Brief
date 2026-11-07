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
  ExternalLink,
  UserCheck,
  X,
} from 'lucide-react';
import {
  Job,
  JobStatus,
  SparePartItem,
  StaffUser,
  Organization,
  QuotationRevision,
} from '../../lib/types';
import {
  ORDERED_STATUSES,
  STATUS_MAP,
  canTransitionTo,
  validateJobTransition,
  hasValidQuotationAuthorization,
  computeQuotationHash,
  mutateJobState,
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

  // Dedicated Homeowner Approval Portal Modal (P0-01)
  const [isHomeownerPortalOpen, setIsHomeownerPortalOpen] = useState(false);
  const [portalApproverName, setPortalApproverName] = useState(job.customerName || '');
  const [portalConfirmedCheck, setPortalConfirmedCheck] = useState(false);
  const [portalMode, setPortalMode] = useState<'QUOTE' | 'WAIVER'>('QUOTE');

  // Technician Verbal Report State (distinct from customer verification)
  const [verbalNotes, setVerbalNotes] = useState('');

  // Quotation Waiver Form States
  const [waiverReason, setWaiverReason] = useState(
    'Bảo trì vệ sinh điều hòa định kỳ theo giá niêm yết chuẩn, không phát sinh linh kiện thay thế.'
  );
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
  // P0-02: Creating a new revision immediately invalidates previous approvals for repair gating!
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
      status: 'pending_homeowner', // Awaiting homeowner approval on portal
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
    setApprovalNotice(
      `Đã lập Báo giá ${hash} (#REV-00${revNumber}) và chuyển trạng thái Chờ duyệt giá. Các duyệt cũ (nếu có) bị thay thế theo P0-02.`
    );
    setTimeout(() => setApprovalNotice(null), 3500);
  };

  // P0-01: Technician records verbal report (NOT customer verification evidence)
  const handleTechnicianRecordVerbal = () => {
    if (!latestRevision) return;

    const updatedRevisions = (job.quotationRevisions || []).map((rev) => {
      if (rev.revisionNumber === latestRevision.revisionNumber) {
        return {
          ...rev,
          technicianReportedApproval: true,
          // Crucial P0-01 invariant: approvedByCustomer remains false until homeowner signs in portal!
          approvedByCustomer: false,
          approvalEvidence: {
            approvedByCustomer: false,
            confirmationMethod: 'technician_verbal_report' as const,
            approverName: job.customerName,
            approvedAt: new Date().toISOString(),
            approvedRevisionNumber: rev.revisionNumber,
            hash: rev.hash,
            snapshotTotal: rev.total,
            notes: verbalNotes.trim() || 'Thợ báo khách đã đồng ý miệng (chờ khách xác nhận trên Cổng gia chủ)',
            isSimulatedVerification: true,
          },
        };
      }
      return rev;
    });

    onUpdateJob({ ...job, quotationRevisions: updatedRevisions });
    setApprovalNotice('Đã ghi nhận báo cáo miệng của thợ. Vui lòng mở Cổng Phê Duyệt để gia chủ xác nhận (QUO-001).');
    setTimeout(() => setApprovalNotice(null), 4000);
  };

  // P0-01: Homeowner Portal Direct Confirmation (Actual Customer Verification Evidence)
  const handleHomeownerPortalConfirm = () => {
    if (!portalConfirmedCheck) {
      alert('Vui lòng tích vào ô xác nhận đồng ý của gia chủ.');
      return;
    }
    if (!portalApproverName.trim()) {
      alert('Vui lòng nhập họ tên người ký duyệt.');
      return;
    }
    if (!latestRevision) return;

    const now = new Date().toISOString();

    if (portalMode === 'QUOTE') {
      const updatedRevisions = (job.quotationRevisions || []).map((rev) => {
        if (rev.revisionNumber === latestRevision.revisionNumber) {
          return {
            ...rev,
            status: 'approved' as const,
            approvedByCustomer: true,
            approverName: portalApproverName.trim(),
            approvedAt: now,
            approvalEvidence: {
              approvedByCustomer: true,
              confirmationMethod: 'homeowner_portal_signature' as const,
              approverName: portalApproverName.trim(),
              approverPhone: job.customerPhone,
              approvedAt: now,
              approvedRevisionNumber: rev.revisionNumber,
              hash: rev.hash,
              snapshotTotal: rev.total,
              notes: 'Gia chủ trực tiếp xác nhận qua Cổng Phê Duyệt Khách Hàng (Mô phỏng Frontend)',
              isSimulatedVerification: true,
            },
          };
        }
        return rev;
      });

      onUpdateJob({ ...job, quotationRevisions: updatedRevisions });
      setIsHomeownerPortalOpen(false);
      setGuardError(null);
      setApprovalNotice(
        `Gia chủ đã ký duyệt Báo giá #${latestRevision.revisionNumber} qua Cổng Phê Duyệt! Đủ điều kiện bắt đầu sửa chữa.`
      );
      setTimeout(() => setApprovalNotice(null), 4000);
    } else {
      // Waiver confirmation by homeowner
      const revNumber = (job.quotationRevisions?.length || 0) + 1;
      const waiverRevision: QuotationRevision = {
        revisionNumber: revNumber,
        hash: `WAIVER-${revNumber}`,
        items: job.selectedServices.map((s) => ({
          description: s.serviceId,
          price: s.price,
          quantity: s.quantity,
        })),
        subtotal: pricing.subtotalServices,
        discount: 0,
        total: pricing.totalPayable,
        status: 'waived',
        waiverReason: waiverReason.trim(),
        customerAcknowledged: true,
        createdAt: now,
        approvedAt: now,
        approverName: portalApproverName.trim(),
        waiverEvidence: {
          waived: true,
          waiverReason: waiverReason.trim(),
          customerAcknowledged: true,
          waivedAt: now,
          waivedBy: portalApproverName.trim(),
          isSimulatedVerification: true,
        },
      };

      onUpdateJob({
        ...job,
        quotationRevisions: [...(job.quotationRevisions || []), waiverRevision],
      });
      setIsHomeownerPortalOpen(false);
      setShowWaiverForm(false);
      setGuardError(null);
      setApprovalNotice('Gia chủ đã xác nhận Biên bản miễn trừ báo giá! Đủ điều kiện bắt đầu sửa chữa.');
      setTimeout(() => setApprovalNotice(null), 4000);
    }
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
    <>
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
                            <span>Đã có phê duyệt phiên bản hiện hành (QUO-001 Đạt):</span>
                          </span>
                          <span className="font-mono text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">
                            {latestRevision?.hash || 'XÁC NHẬN'}
                          </span>
                        </div>
                        <div className="text-emerald-800 text-[11px]">
                          Người ký duyệt: <strong>{latestRevision?.approverName || latestRevision?.waiverReason}</strong>
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
                          <span>Chờ khách duyệt báo giá hoặc xác nhận miễn trừ (QUO-001)</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Phiên bản hiện hành #{latestRevision?.revisionNumber || 1} ({latestRevision?.hash || 'Đang tạo'}) chưa có chữ ký duyệt của khách hàng.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="teal"
                            size="md"
                            fullWidth
                            onClick={() => {
                              setActiveTab('QUOTATION');
                              setPortalMode('QUOTE');
                              setIsHomeownerPortalOpen(true);
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Mở Cổng Phê Duyệt Khách Hàng (Ký duyệt)
                          </Button>
                        </div>
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
                      ? 'Phiên bản báo giá hiện hành đã được duyệt (QUO-001 Đạt)'
                      : 'Chưa có bằng chứng duyệt cho phiên bản hiện hành'}
                  </div>
                  <div className="text-[11px] opacity-90">
                    {isAuthorizedForRepair
                      ? `Mã xác thực: ${latestRevision?.hash} • Người duyệt: ${latestRevision?.approverName || 'Khách hàng'}`
                      : 'Cần mở Cổng Phê Duyệt để gia chủ ký nhận hoặc xác nhận miễn trừ'}
                  </div>
                </div>
              </div>
              {isAuthorizedForRepair && (
                <Badge variant="success">Đủ điều kiện sửa</Badge>
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
                Khi tạo revision mới, mọi phê duyệt cũ sẽ hết hiệu lực theo nguyên tắc P0-02. Cần gia chủ ký duyệt lại trên phiên bản mới.
              </p>
              <Button
                variant="teal"
                size="md"
                fullWidth
                onClick={handleCreateAndSendRevision}
              >
                Lập Báo giá Snapshot &rarr; Chuyển sang chờ khách duyệt
              </Button>
            </div>

            {/* QUO-001 Action Form 2: P0-01 Separation between Homeowner Portal & Tech Verbal Note */}
            {latestRevision && latestRevision.status === 'pending_homeowner' && (
              <div className="space-y-3">
                {/* 2A: The Homeowner Approval Portal Trigger (Actual Customer Evidence) */}
                <div className="p-4 bg-white rounded-2xl border-2 border-teal-500 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-teal-600" />
                      <span>2A. Cổng Phê Duyệt Khách Hàng (Dành cho Gia chủ xác nhận)</span>
                    </span>
                    <span className="text-[11px] font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-bold border border-teal-200">
                      {latestRevision.hash}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Theo quy chuẩn P0-01, thợ không được tự tích duyệt thay khách. Mở giao diện để gia chủ xem trực tiếp và ký duyệt điện tử.
                  </p>
                  <Button
                    variant="teal"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setPortalMode('QUOTE');
                      setIsHomeownerPortalOpen(true);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    Mở Cổng Phê Duyệt Khách Hàng (Mô phỏng Gia chủ ký duyệt)
                  </Button>
                </div>

                {/* 2B: Technician Verbal Agreement Note (Distinct from customer verification) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>2B. Ghi nhận thợ đã trao đổi miệng với khách:</span>
                  </div>
                  <input
                    type="text"
                    value={verbalNotes}
                    onChange={(e) => setVerbalNotes(e.target.value)}
                    placeholder="VD: Đã gọi điện lúc 10h15, khách nói đồng ý miệng mức giá..."
                    className="w-full h-9 px-3 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      * Báo cáo miệng không thay thế cho xác nhận của khách trên Cổng phê duyệt.
                    </span>
                    <button
                      type="button"
                      onClick={handleTechnicianRecordVerbal}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold"
                    >
                      Lưu ghi chú thợ
                    </button>
                  </div>
                </div>
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
                    Áp dụng khi ca làm việc là bảo dưỡng tiêu chuẩn theo giá niêm yết cố định, không thay thế linh kiện phát sinh.
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

                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    disabled={!waiverReason.trim()}
                    onClick={() => {
                      setPortalMode('WAIVER');
                      setIsHomeownerPortalOpen(true);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    Mở Cổng để Gia chủ ký xác nhận Miễn trừ (Waiver)
                  </Button>
                </div>
              )}
            </div>

            {/* Quotation History Audit Trail (Shows superseding status) */}
            {job.quotationRevisions && job.quotationRevisions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Lịch sử các phiên bản báo giá (#REV Audit Log):</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {job.quotationRevisions.map((rev, index) => {
                    const isLatest = index === job.quotationRevisions!.length - 1;
                    return (
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
                            {isLatest ? (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                                Hiện hành
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                (Đã bị thay thế)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {rev.status === 'approved' && `Duyệt bởi: ${rev.approverName} lúc ${new Date(rev.approvedAt || rev.createdAt).toLocaleTimeString('vi-VN')}`}
                            {rev.status === 'waived' && `Lý do: ${rev.waiverReason}`}
                            {rev.status === 'pending_homeowner' && 'Đang chờ gia chủ ký duyệt'}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 text-right">
                          {formatVND(rev.total)}
                        </div>
                      </div>
                    );
                  })}
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

      {/* DEDICATED HOMEOWNER APPROVAL PORTAL MODAL (P0-01: Authentic Mock Homeowner Flow) */}
      {isHomeownerPortalOpen && latestRevision && (
        <Modal
          isOpen={isHomeownerPortalOpen}
          onClose={() => setIsHomeownerPortalOpen(false)}
          title={portalMode === 'QUOTE' ? 'Cổng Phê Duyệt Báo Giá Khách Hàng' : 'Cổng Xác Nhận Miễn Trừ Báo Giá'}
          subtitle={`Gia chủ: ${job.customerName} • Ca làm việc #${job.id}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Transparent Prototype Disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>[MÔ PHỎNG FRONTEND] Cổng Phê Duyệt Khách Hàng ThợOS</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Màn hình này mô phỏng giao diện gia chủ truy cập qua tin nhắn SMS / Zalo link để trực tiếp kiểm tra và ký duyệt chi phí (chưa tích hợp e-KYC/chữ ký số backend production).
              </p>
            </div>

            {/* Customer & Location Dossier */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <strong className="text-slate-900">{job.customerName} ({job.customerPhone})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Địa chỉ:</span>
                <span className="text-slate-800 font-medium">{job.address}, {job.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thiết bị:</span>
                <span className="text-slate-800 font-bold">{job.brand} {job.horsePower}</span>
              </div>
            </div>

            {portalMode === 'QUOTE' ? (
              <>
                {/* Itemized Snapshot Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="p-2.5 bg-slate-100 font-bold text-slate-800 flex justify-between">
                    <span>Nội dung chi phí (#REV-00{latestRevision.revisionNumber})</span>
                    <span className="font-mono text-[11px] text-slate-600">{latestRevision.hash}</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {latestRevision.items.map((item, i) => (
                      <div key={i} className="p-2.5 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-900">{item.description}</div>
                          <div className="text-[11px] text-slate-500">SL: {item.quantity}</div>
                        </div>
                        <div className="font-bold text-slate-900">
                          {formatVND(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-teal-50 border-t border-teal-200 flex justify-between items-center text-sm">
                    <span className="font-bold text-teal-950">Tổng thanh toán dự kiến:</span>
                    <span className="text-base font-black text-teal-900">{formatVND(latestRevision.total)}</span>
                  </div>
                </div>

                {/* Homeowner Signature Form */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Họ tên gia chủ hoặc người đại diện ký duyệt:
                    </label>
                    <input
                      type="text"
                      value={portalApproverName}
                      onChange={(e) => setPortalApproverName(e.target.value)}
                      placeholder="VD: Nguyễn Thị Mai"
                      className="w-full h-10 px-3 text-xs bg-white rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={portalConfirmedCheck}
                      onChange={(e) => setPortalConfirmedCheck(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-600"
                    />
                    <span className="text-xs text-slate-800 leading-snug">
                      Tôi là gia chủ / đại diện, tôi đã xem xét đầy đủ bảng giá chi tiết <strong>{formatVND(latestRevision.total)}</strong> và xác nhận phê duyệt cho kỹ thuật viên tiến hành dịch vụ.
                    </span>
                  </label>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setIsHomeownerPortalOpen(false)}
                      className="flex-1"
                    >
                      Đóng
                    </Button>
                    <Button
                      variant="teal"
                      size="md"
                      disabled={!portalConfirmedCheck || !portalApproverName.trim()}
                      onClick={handleHomeownerPortalConfirm}
                      className="flex-1 font-bold"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Gia chủ ký duyệt báo giá
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Waiver Confirmation View
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-blue-900">Biên bản miễn trừ lập báo giá chi tiết (Waiver):</div>
                  <div className="text-blue-800 font-medium">Lý do: {waiverReason}</div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Họ tên gia chủ xác nhận:
                  </label>
                  <input
                    type="text"
                    value={portalApproverName}
                    onChange={(e) => setPortalApproverName(e.target.value)}
                    placeholder="VD: Nguyễn Thị Mai"
                    className="w-full h-10 px-3 text-xs bg-white rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <label className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={portalConfirmedCheck}
                    onChange={(e) => setPortalConfirmedCheck(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-600"
                  />
                  <span className="text-xs text-slate-800 leading-snug">
                    Tôi xác nhận đồng ý miễn trừ lập bảng báo giá phát sinh và chỉ thanh toán theo đơn giá dịch vụ đã thỏa thuận.
                  </span>
                </label>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsHomeownerPortalOpen(false)}
                    className="flex-1"
                  >
                    Đóng
                  </Button>
                  <Button
                    variant="teal"
                    size="md"
                    disabled={!portalConfirmedCheck || !portalApproverName.trim()}
                    onClick={handleHomeownerPortalConfirm}
                    className="flex-1 font-bold"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Gia chủ xác nhận Miễn trừ
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
