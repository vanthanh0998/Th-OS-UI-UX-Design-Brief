import React from 'react';
import {
  X,
  Sliders,
  Shield,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Archive,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Organization } from '../../lib/types';
import { Button } from '../ui/Button';

interface DemoReviewToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // State design feedback simulator
  feedbackState: 'NONE' | '403_FORBIDDEN' | '409_CONFLICT' | 'SKELETON_LOADING';
  onSetFeedbackState: (state: 'NONE' | '403_FORBIDDEN' | '409_CONFLICT' | 'SKELETON_LOADING') => void;
  // Offline simulator
  isOffline: boolean;
  onToggleOffline: () => void;
  // Sub-modals
  onOpenSpecModal: () => void;
  onOpenMarketplaceModal: () => void;
  onOpenHandoverModal: () => void;
  onOpenSwitchOrgModal: () => void;
  currentOrg: Organization;
}

export const DemoReviewToolsModal: React.FC<DemoReviewToolsModalProps> = ({
  isOpen,
  onClose,
  feedbackState,
  onSetFeedbackState,
  isOffline,
  onToggleOffline,
  onOpenSpecModal,
  onOpenMarketplaceModal,
  onOpenHandoverModal,
  onOpenSwitchOrgModal,
  currentOrg,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#0a1e3f] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Design Review & Demo Tools
              </h2>
              <p className="text-xs text-slate-300">
                Khu vực kiểm thử dành riêng cho PO, QC và Đánh giá kỹ thuật
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: State Design Simulator */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Mô phỏng trạng thái ngoại lệ (State Design)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  onSetFeedbackState(feedbackState === '403_FORBIDDEN' ? 'NONE' : '403_FORBIDDEN');
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                  feedbackState === '403_FORBIDDEN'
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>403 Forbidden</span>
                  {feedbackState === '403_FORBIDDEN' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />}
                </div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">Không đủ quyền RBAC</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetFeedbackState(feedbackState === '409_CONFLICT' ? 'NONE' : '409_CONFLICT');
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                  feedbackState === '409_CONFLICT'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>409 Conflict</span>
                  {feedbackState === '409_CONFLICT' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">Xung đột sửa đồng thời</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetFeedbackState(feedbackState === 'SKELETON_LOADING' ? 'NONE' : 'SKELETON_LOADING');
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                  feedbackState === 'SKELETON_LOADING'
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Skeleton Loading</span>
                  {feedbackState === 'SKELETON_LOADING' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">Khung xương tải trang</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleOffline();
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left font-semibold transition-all ${
                  isOffline
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Offline Simulator</span>
                  {isOffline && <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />}
                </div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">Mô phỏng mất mạng</div>
              </button>
            </div>
          </div>

          {/* Section 2: Reference Specs & Export */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              2. Tài liệu kỹ thuật & Bàn giao
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSpecModal();
                }}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <div>
                    <div>Bảng Design Tokens & Wireframe Specs</div>
                    <div className="text-[11px] font-normal text-slate-500">Màu sắc, kiểu chữ, chuẩn touch-target và wireframe baseline</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMarketplaceModal();
                }}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div>
                    <div>Marketplace Concept (Future — Not MVP)</div>
                    <div className="text-[11px] font-normal text-slate-500">3 ý tưởng định hướng PO phê duyệt</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHandoverModal();
                }}
                className="w-full p-3 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 flex items-center justify-between text-left text-xs font-bold text-teal-900 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-teal-700" />
                  <div>
                    <div>Tải Gói Bàn Giao Mã Nguồn (ZIP / Patch / Bundle)</div>
                    <div className="text-[11px] font-normal text-teal-700">Tệp xuất xưởng nghiệm thu kỹ thuật</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
              </button>
            </div>
          </div>

          {/* Section 3: Switch Tenant Organization */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              3. Quản trị Tenant đa tổ chức
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSwitchOrgModal();
              }}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-teal-600" />
                <div className="text-left">
                  <div>Tổ chức hiện tại: {currentOrg.name} ({currentOrg.shortCode})</div>
                  <div className="text-[11px] font-normal text-slate-500">Đổi tổ chức để kiểm tra cách ly dữ liệu (DEC-02)</div>
                </div>
              </div>
              <span className="text-xs text-teal-700 underline">Đổi</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
