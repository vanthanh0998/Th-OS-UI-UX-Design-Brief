import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { StaffRole, StaffUser } from '../../lib/types';
import { Button } from '../ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffUsers: StaffUser[];
  currentUser: StaffUser;
  onSelectUser: (user: StaffUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  staffUsers,
  currentUser,
  onSelectUser,
}) => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT_PASSWORD' | 'SESSION'>('LOGIN');

  // Baseline v2.0: Nhân sự đăng nhập bằng verified email & password
  const [loginEmail, setLoginEmail] = useState(currentUser.email);
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Password reset via verified work email
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Owner (Chủ tổ chức)</span>;
      case 'manager':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">Manager (Điều phối & Quản lý)</span>;
      case 'technician':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200">Technician (Thợ kỹ thuật)</span>;
    }
  };

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Demo password check: validate minimum length and demo credential
    if (!loginPassword || loginPassword.trim().length < 6) {
      setLoginError('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (loginPassword.trim() !== 'password123' && loginPassword.trim() !== 'thoos123') {
      setLoginError('Mật khẩu không chính xác! (Mật khẩu thử nghiệm môi trường prototype: password123)');
      return;
    }

    // Look up staff user strictly by email. Role is NEVER self-selected.
    const cleanEmail = loginEmail.trim().toLowerCase();
    const matchedUser = staffUsers.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!matchedUser) {
      setLoginError('Email không tồn tại trong danh sách nhân sự của tổ chức!');
      return;
    }

    if (!matchedUser.active) {
      setLoginError('Tài khoản nhân sự này đã bị vô hiệu hóa bởi Owner!');
      return;
    }

    // Role and permissions are strictly resolved from membership data
    onSelectUser(matchedUser);
    setLoginSuccess(true);
    setTimeout(() => {
      setLoginSuccess(false);
      onClose();
    }, 600);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="bg-[#0a1e3f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0d9488] flex items-center justify-center text-white font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">ThợOS Staff Authentication</h3>
              <p className="text-xs text-amber-300 font-semibold">Demo Authentication (Giả lập UI - Chưa kết nối backend)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setView('LOGIN')}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              view === 'LOGIN' ? 'border-[#0d9488] text-[#0a1e3f] bg-white' : 'border-transparent'
            }`}
          >
            Đăng nhập nhân sự
          </button>
          <button
            type="button"
            onClick={() => setView('FORGOT_PASSWORD')}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              view === 'FORGOT_PASSWORD' ? 'border-[#0d9488] text-[#0a1e3f] bg-white' : 'border-transparent'
            }`}
          >
            Khôi phục mật khẩu
          </button>
          <button
            type="button"
            onClick={() => setView('SESSION')}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              view === 'SESSION' ? 'border-[#0d9488] text-[#0a1e3f] bg-white' : 'border-transparent'
            }`}
          >
            Phiên làm việc (Mock)
          </button>
        </div>

        <div className="p-5">
          {/* ======================================================== */}
          {/* VIEW 1: ĐĂNG NHẬP BẰNG EMAIL & PASSWORD (DEMO)           */}
          {/* ======================================================== */}
          {view === 'LOGIN' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">Môi trường thử nghiệm (Demo Authentication):</span> Xác thực tài khoản diễn ra cục bộ phía client, chưa qua dịch vụ xác thực backend hoặc OAuth. Mật khẩu mẫu: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">password123</code>.
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Xác thực thành công! Đang thiết lập phiên làm việc...</span>
                </div>
              )}

              <form onSubmit={handleCredentialsLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email nhân sự đã xác minh *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="VD: thanh.nguyen@dienlanhsgx.vn"
                      className="w-full h-11 pl-9 pr-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488] font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full h-11 pl-9 pr-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Mật khẩu mẫu: password123</span>
                  <button
                    type="button"
                    onClick={() => setView('FORGOT_PASSWORD')}
                    className="text-[#0d9488] font-bold hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <Button variant="teal" size="lg" type="submit" fullWidth className="mt-2 font-bold">
                  Đăng Nhập Vào Hệ Thống
                </Button>
              </form>

              {/* DEMO SHOWCASE ONLY: Nạp nhanh thông tin nhân sự mẫu để giám khảo/QC kiểm thử */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Demo Showcase Tool (Dành riêng cho QC/Reviewer):
                  </span>
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                    DEMO ONLY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {staffUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setLoginEmail(u.email);
                        onSelectUser(u);
                      }}
                      className={`p-2 rounded-xl border text-left text-[11px] transition-all ${
                        u.id === currentUser.id
                          ? 'border-teal-500 bg-teal-50/70 text-teal-900 font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                      }`}
                    >
                      <div className="truncate">{u.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {u.role} ({u.email})
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: KHÔI PHỤC MẬT KHẨU QUA VERIFIED EMAIL LINK       */}
          {/* ======================================================== */}
          {view === 'FORGOT_PASSWORD' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Khôi phục qua Email công việc:</strong> Nhập địa chỉ email nhân sự đã xác minh để nhận liên kết đặt lại mật khẩu an toàn.
                </p>
              </div>

              {resetSent ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="text-sm font-bold text-emerald-900">Đã gửi liên kết khôi phục!</div>
                  <p className="text-xs text-emerald-700">
                    Email chứa liên kết đặt lại mật khẩu đã được gửi đến <strong>{resetEmail}</strong>. Vui lòng kiểm tra hộp thư đến hoặc thư rác.
                  </p>
                  <Button variant="teal" size="sm" onClick={() => { setResetSent(false); setView('LOGIN'); }}>
                    Quay lại màn hình Đăng nhập
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email công việc nhân sự *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="VD: thanh.nguyen@dienlanhsgx.vn"
                        className="w-full h-11 pl-9 pr-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                      />
                    </div>
                  </div>
                  <Button variant="teal" size="md" fullWidth type="submit">
                    Gửi Liên Kết Đặt Lại Mật Khẩu Qua Email
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: THÔNG TIN PHIÊN ĐĂNG NHẬP & PHÂN LẬP TENANT */}
          {/* ======================================================== */}
          {view === 'SESSION' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tài khoản nhân sự:</span>
                  <span className="font-bold text-slate-900">{currentUser.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email công việc:</span>
                  <span className="font-semibold text-slate-800">{currentUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Quyền hạn trong tổ chức:</span>
                  <span>{getRoleBadge(currentUser.role)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã Tổ chức (Tenant ID):</span>
                  <span className="font-mono font-bold text-slate-900">{currentUser.organizationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời hạn phiên đăng nhập:</span>
                  <span className="font-semibold text-emerald-600">Còn hiệu lực (Hết hạn sau 8 giờ)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Nguyên tắc Multi-tenancy (DEC-02):</strong> Toàn bộ dữ liệu khách hàng, thiết bị và công việc được phân lập tuyệt đối theo tổ chức này. Không thể truy cập dữ liệu của tổ chức khác.
              </div>

              <Button variant="danger" size="md" fullWidth onClick={onClose}>
                Đóng phiên làm việc
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
