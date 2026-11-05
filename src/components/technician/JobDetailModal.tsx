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
  Sparkles,
} from 'lucide-react';
import { Job, JobStatus, SparePartItem } from '../../lib/types';
import { ORDERED_STATUSES, STATUS_MAP, canTransitionTo } from '../../lib/status-machine';
import { COMMON_SPARE_PARTS, SERVICE_CATALOG, calculateJobTotal, formatVND } from '../../lib/pricing';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateJob: (updatedJob: Job) => void;
  onOpenInvoice: (job: Job) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateJob,
  onOpenInvoice,
}) => {
  if (!job) return null;

  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'CHECKLIST' | 'QUOTATION' | 'PHOTOS'>('WORKFLOW');
  const [copied, setCopied] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');

  // Editable fields local state
  const [checklist, setChecklist] = useState(job.checklist);
  const [spareParts, setSpareParts] = useState<SparePartItem[]>(job.spareParts || []);
  const [discount, setDiscount] = useState<number>(job.discount || 0);

  const pricing = calculateJobTotal(job.selectedServices, spareParts, discount);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${job.address}, ${job.district}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusTransition = (nextStatus: JobStatus) => {
    if (!canTransitionTo(job.status, nextStatus)) return;
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
              <span className="text-[#0d9488] font-semibold">{job.distanceKm} km</span>
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
          className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'QUOTATION'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Báo giá & Phụ tùng
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {job.status === 'MOI' && (
                <Button
                  variant="teal"
                  size="lg"
                  fullWidth
                  onClick={() => handleStatusTransition('DANG_TOI')}
                >
                  <Navigation className="w-5 h-5 mr-1" />
                  Nhận đơn & Bắt đầu đi ({job.distanceKm} km)
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
                <>
                  <Button
                    variant="teal"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      handleStatusTransition('BAO_GIA');
                      setActiveTab('QUOTATION');
                    }}
                  >
                    Lập bảng báo giá cho khách
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => handleStatusTransition('DANG_SUA')}
                  >
                    Không phát sinh &rarr; Bắt đầu làm ngay
                  </Button>
                </>
              )}

              {job.status === 'BAO_GIA' && (
                <Button
                  variant="teal"
                  size="lg"
                  fullWidth
                  onClick={() => handleStatusTransition('DANG_SUA')}
                >
                  Khách đã đồng ý &rarr; Tiến hành sửa chữa
                </Button>
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
              <div className="text-xs text-slate-400">Tổng tiền thu khách:</div>
              <div className="text-xl font-black text-[#14b8a6]">
                {formatVND(pricing.totalPayable)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Thợ thực nhận:</div>
              <div className="text-sm font-bold text-emerald-400">
                {formatVND(pricing.technicianPayout)}
              </div>
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
              { key: 'drainPipeCleared', label: 'Đã thông thông máng xối và ống thoát nước thải' },
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

      {/* TAB 3: QUOTATION & SPARE PARTS */}
      {activeTab === 'QUOTATION' && (
        <div className="space-y-4">
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

          {/* Discount and Summary */}
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
              <span>Tổng thanh toán:</span>
              <span className="text-base text-[#0d9488] font-black">{formatVND(pricing.totalPayable)}</span>
            </div>
          </div>
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
