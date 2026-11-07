import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { Organization, StaffUser, SubscriptionStatus } from '../../lib/types';
import {
  canSwitchToOrganization,
  getUserMemberships,
  INITIAL_MEMBERSHIPS,
} from '../../lib/org-membership';
import { Button } from '../ui/Button';

interface SwitchOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  currentOrg: Organization;
  currentUser: StaffUser;
  onSelectOrg: (org: Organization) => void;
}

export const SwitchOrganizationModal: React.FC<SwitchOrganizationModalProps> = ({
  isOpen,
  onClose,
  organizations,
  currentOrg,
  currentUser,
  onSelectOrg,
}) => {
  const [denialError, setDenialError] = useState<string | null>(null);

  if (!isOpen) return null;

  const userMemberships = getUserMemberships(currentUser.id, INITIAL_MEMBERSHIPS);

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Đang hoạt động
          </span>
        );
      case 'trial':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Dùng thử (Trial)
          </span>
        );
      case 'grace':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Gia hạn (Grace)
          </span>
        );
      case 'read_only':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            Chỉ đọc
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Đình chỉ
          </span>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Chủ cơ sở (Owner)';
      case 'manager':
        return 'Quản lý (Manager)';
      case 'technician':
        return 'Kỹ thuật viên';
      default:
        return role;
    }
  };

  const handleOrgClick = (org: Organization) => {
    setDenialError(null);
    const check = canSwitchToOrganization(currentUser.id, org.id, INITIAL_MEMBERSHIPS);

    if (!check.allowed) {
      setDenialError(
        `Từ chối truy cập: Người dùng "${currentUser.fullName}" không có tư cách thành viên (membership) hợp lệ tại tổ chức "${org.name}".`
      );
      return;
    }

    onSelectOrg(org);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-[#0a1e3f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0d9488] flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">Chuyển đổi Tổ chức (Tenant)</h3>
              <p className="text-xs text-slate-300">
                Tài khoản: <strong className="text-white">{currentUser.fullName}</strong> ({userMemberships.length} tổ chức hợp lệ)
              </p>
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
          {/* Access Denial Alert if clicked unauthorized org */}
          {denialError && (
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Cảnh báo vi phạm bảo mật Tenant (P0-01):</strong>
                <span>{denialError}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Dữ liệu khách hàng, thiết bị và công việc được cách ly tuyệt đối giữa các tổ chức. Hệ thống chỉ cho phép chuyển sang tổ chức mà bạn có tư cách thành viên:
          </p>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {organizations.map((org) => {
              const isSelected = org.id === currentOrg.id;
              const membership = userMemberships.find((m) => m.organizationId === org.id);
              const hasMembership = !!membership;

              return (
                <div
                  key={org.id}
                  onClick={() => handleOrgClick(org)}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    !hasMembership
                      ? 'border-slate-200 bg-slate-50/70 opacity-65 cursor-not-allowed'
                      : isSelected
                      ? 'border-[#0d9488] bg-teal-50/70 ring-2 ring-[#0d9488]/20 cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-[#0a1e3f] bg-slate-100 px-2 py-0.5 rounded-md">
                          {org.shortCode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{org.name}</h4>
                        {!hasMembership && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                            <Lock className="w-3 h-3 text-slate-500" /> Không có quyền
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {org.address}, {org.city}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Hotline: {org.phone} • {org.memberCount} thành viên
                      </div>
                    </div>
                    <div>{getStatusBadge(org.subscriptionStatus)}</div>
                  </div>

                  {hasMembership ? (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                        Vai trò: <strong className="text-slate-900">{getRoleLabel(membership.role)}</strong>
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 font-bold text-[#0d9488]">
                          <CheckCircle2 className="w-4 h-4" /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-[11px] text-teal-700 font-semibold underline">
                          Bấm để chuyển sang
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-slate-200/40 text-[11px] text-slate-500 italic">
                      Tài khoản của bạn không có membership tại tổ chức này.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Quy tắc Bảo mật Đa tổ chức (Tenant Isolation P0-01)</div>
              <div className="text-[11px] text-slate-500">
                Danh tính người dùng được bảo toàn khi đổi tổ chức, không tự ý gán sang nhân viên khác.
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
