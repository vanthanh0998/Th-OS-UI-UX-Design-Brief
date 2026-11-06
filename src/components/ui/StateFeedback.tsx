import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  WifiOff,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from './Button';

interface StateFeedbackProps {
  type: '403_FORBIDDEN' | '409_CONFLICT' | 'NETWORK_ERROR' | 'SKELETON_LOADING';
  onAction?: () => void;
  actionLabel?: string;
  message?: string;
}

export const StateFeedback: React.FC<StateFeedbackProps> = ({
  type,
  onAction,
  actionLabel = 'Thử lại',
  message,
}) => {
  if (type === 'SKELETON_LOADING') {
    return (
      <div className="space-y-3 p-4 bg-white rounded-3xl border border-slate-200 animate-pulse">
        <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-16 bg-slate-100 rounded-2xl" />
          <div className="h-16 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (type === '403_FORBIDDEN') {
    return (
      <div className="p-6 bg-white rounded-3xl border border-rose-200 shadow-sm text-center max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-base text-slate-900">403 — Không Có Quyền Truy Cập</h4>
        <p className="text-xs text-slate-600">
          {message || 'Vai trò tài khoản hiện tại của bạn không có quyền hạn thực hiện hoặc xem chức năng quản trị này (RBAC).'}
        </p>
        {onAction && (
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  if (type === '409_CONFLICT') {
    return (
      <div className="p-6 bg-white rounded-3xl border border-amber-200 shadow-sm text-center max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-base text-slate-900">409 — Xung Đột Chỉnh Sửa (Stale Edit)</h4>
        <p className="text-xs text-slate-600">
          {message || 'Dữ liệu hồ sơ này vừa được điều phối viên hoặc nhân sự khác cập nhật ở phiên làm việc khác. Vui lòng tải lại dữ liệu mới nhất.'}
        </p>
        {onAction && (
          <Button variant="teal" size="sm" onClick={onAction}>
            <RotateCcw className="w-4 h-4 mr-1" /> {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
        <WifiOff className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-base text-slate-900">Mất Kết Nối Máy Chủ</h4>
      <p className="text-xs text-slate-600">
        {message || 'Không thể đồng bộ dữ liệu tới hệ thống. Vui lòng kiểm tra kết nối mạng 4G/Wifi.'}
      </p>
      {onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
