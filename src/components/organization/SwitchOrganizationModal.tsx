import React, { useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { Organization, SubscriptionStatus } from '../../lib/types';
import { Button } from '../ui/Button';

interface SwitchOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  currentOrg: Organization;
  onSelectOrg: (org: Organization) => void;
}

export const SwitchOrganizationModal: React.FC<SwitchOrganizationModalProps> = ({
  isOpen,
  onClose,
  organizations,
  currentOrg,
  onSelectOrg,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Đang hoạt động</span>;
      case 'trial':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Dùng thử (Trial)</span>;
      case 'grace':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Gia hạn (Grace 1-7 ngày)</span>;
      case 'read_only':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Chỉ đọc (8-30 ngày)</span>;
      case 'suspended':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Bị đình chỉ (DEC-05)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-[#0a1e3f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0d9488] flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">Chuyển đổi Tổ chức (Tenant)</h3>
              <p className="text-xs text-slate-300">Multi-tenancy DEC-01 & DEC-02</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Dữ liệu khách hàng, thiết bị và công việc thuộc quyền sở hữu riêng biệt của từng tổ chức. Chọn workspace làm việc:
          </p>

          <div className="space-y-2.5">
            {organizations.map((org) => {
              const isSelected = org.id === currentOrg.id;
              return (
                <div
                  key={org.id}
                  onClick={() => {
                    onSelectOrg(org);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#0d9488] bg-teal-50/70 ring-2 ring-[#0d9488]/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-[#0a1e3f] bg-slate-100 px-2 py-0.5 rounded-md">
                          {org.shortCode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{org.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{org.address}, {org.city}</p>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Hotline: {org.phone} • {org.memberCount} thành viên
                      </div>
                    </div>
                    <div>{getStatusBadge(org.subscriptionStatus)}</div>
                  </div>

                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-teal-200/60 flex items-center gap-1.5 text-xs font-bold text-[#0d9488]">
                      <CheckCircle2 className="w-4 h-4" /> Đang hoạt động trên workspace này
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Quy tắc Vòng đời Thuê bao (DEC-05)</div>
              <div className="text-[11px] text-slate-500">
                Grace (ngày 1–7) &rarr; Read-only (ngày 8–30) &rarr; Suspended
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="md" onClick={onClose} fullWidth>
              Đóng cửa sổ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
