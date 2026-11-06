import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { StaffRole, StaffUser, Organization } from '../../lib/types';
import { Button } from '../ui/Button';

interface TeamMembersViewProps {
  currentOrg: Organization;
  currentUser: StaffUser;
  staffUsers: StaffUser[];
  onAddMember?: (user: StaffUser) => void;
  onUpdateRole?: (userId: string, newRole: StaffRole) => void;
}

export const TeamMembersView: React.FC<TeamMembersViewProps> = ({
  currentOrg,
  currentUser,
  staffUsers,
  onAddMember,
  onUpdateRole,
}) => {
  const [filterRole, setFilterRole] = useState<'ALL' | StaffRole>('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('technician');

  const orgMembers = staffUsers.filter((u) => u.organizationId === currentOrg.id);
  const filteredMembers = orgMembers.filter((u) => (filterRole === 'ALL' ? true : u.role === filterRole));

  const canManageMembers = currentUser.role === 'owner' || currentUser.role === 'manager';

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">Chủ đội (Owner)</span>;
      case 'manager':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">Quản lý / Điều phối</span>;
      case 'technician':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">Kỹ thuật viên</span>;
    }
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) return;

    if (onAddMember) {
      const created: StaffUser = {
        id: `staff-${Date.now()}`,
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || `${newPhone.trim()}@dienlanh.vn`,
        role: newRole,
        organizationId: currentOrg.id,
        active: true,
        assignedDistricts: ['Quận 1'],
      };
      onAddMember(created);
    }
    setIsInviteModalOpen(false);
    setNewFullName('');
    setNewPhone('');
    setNewEmail('');
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <Building2 className="w-4 h-4 text-[#0d9488]" />
            <span>{currentOrg.name}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Quản trị Thành viên & Phân quyền RBAC
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân định quyền hạn chuẩn hóa: Owner, Manager (kèm quyền Điều phối), Technician
          </p>
        </div>

        {canManageMembers ? (
          <Button
            variant="teal"
            size="md"
            onClick={() => setIsInviteModalOpen(true)}
            className="self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Thêm thành viên
          </Button>
        ) : (
          <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Chỉ Owner và Manager có quyền thêm/sửa nhân sự</span>
          </div>
        )}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'ALL', label: `Tất cả (${orgMembers.length})` },
          { key: 'owner', label: `Owner (${orgMembers.filter((m) => m.role === 'owner').length})` },
          { key: 'manager', label: `Manager (${orgMembers.filter((m) => m.role === 'manager').length})` },
          { key: 'technician', label: `Technician (${orgMembers.filter((m) => m.role === 'technician').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterRole(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterRole === tab.key
                ? 'bg-[#0a1e3f] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredMembers.map((member) => {
          const isMe = member.id === currentUser.id;
          return (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                isMe ? 'border-teal-500/80 ring-2 ring-teal-500/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 text-[#0a1e3f] font-black text-sm flex items-center justify-center border border-slate-200">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{member.fullName}</span>
                      {isMe && (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                          Bạn
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{member.email}</div>
                  </div>
                </div>
                <div>{getRoleBadge(member.role)}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>{member.phone}</span>
                </div>

                {canManageMembers && !isMe ? (
                  <select
                    value={member.role}
                    onChange={(e) => {
                      if (onUpdateRole) onUpdateRole(member.id, e.target.value as StaffRole);
                    }}
                    className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="technician">Vai trò: Technician</option>
                    <option value="manager">Vai trò: Manager</option>
                    <option value="owner">Vai trò: Owner</option>
                  </select>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Trạng thái: <span className="text-emerald-600 font-semibold">Đang hoạt động</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
            <div className="bg-[#0a1e3f] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0d9488]" />
                <h3 className="font-bold text-sm">Thêm Nhân Sự Vào Tổ Chức</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên nhân sự *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="VD: 0912 345 678"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email (tùy chọn)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="VD: a.nguyen@dienlanh.vn"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò phân quyền (RBAC) *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as StaffRole)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                >
                  <option value="technician">Technician (Thợ kỹ thuật trực tiếp)</option>
                  <option value="manager">Manager (Quản lý & Điều phối ca)</option>
                  <option value="owner">Owner (Đồng quản trị tổ chức)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setIsInviteModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="teal" size="md" type="submit">
                  Lưu Nhân Sự
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
