import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Layout,
  CheckCircle2,
  Smartphone,
  Eye,
  ShieldCheck,
  MousePointer,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface SprintSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SprintSpecModal: React.FC<SprintSpecModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'TOKENS' | 'COMPONENTS' | 'WIREFRAMES' | 'CHECKLIST'>('TOKENS');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tài Liệu Design Tokens, Thư Viện UI & Wireframe Sprint 1"
      subtitle="ThợOS - Kiến trúc hệ thống thiết kế Mobile-First"
      maxWidth="xl"
    >
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 mb-4 pb-1">
        <button
          type="button"
          onClick={() => setTab('TOKENS')}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            tab === 'TOKENS'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Palette className="w-3.5 h-3.5 inline mr-1" />
          Design Tokens
        </button>
        <button
          type="button"
          onClick={() => setTab('COMPONENTS')}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            tab === 'COMPONENTS'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1" />
          Component Library
        </button>
        <button
          type="button"
          onClick={() => setTab('WIREFRAMES')}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            tab === 'WIREFRAMES'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layout className="w-3.5 h-3.5 inline mr-1" />
          Wireframe Sprint 1
        </button>
        <button
          type="button"
          onClick={() => setTab('CHECKLIST')}
          className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            tab === 'CHECKLIST'
              ? 'border-[#0d9488] text-[#0d9488]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
          Checklist UI/UX
        </button>
      </div>

      {/* 1. DESIGN TOKENS */}
      {tab === 'TOKENS' && (
        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2">Bảng Màu Nhận Diện (Color Palette)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-[#0a1e3f] text-white">
                <div className="font-bold">Deep Navy</div>
                <div className="text-[10px] text-slate-300">#0A1E3F</div>
                <div className="text-[10px] text-slate-400 mt-1">Độ tin cậy, thợ chuyên nghiệp</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0d9488] text-white">
                <div className="font-bold">Action Teal</div>
                <div className="text-[10px] text-teal-100">#0D9488</div>
                <div className="text-[10px] text-teal-100 mt-1">Hành động chính, nút gọi, nhận việc</div>
              </div>
              <div className="p-3 rounded-xl bg-[#f8fafc] text-slate-800 border border-slate-200">
                <div className="font-bold">Canvas Slate</div>
                <div className="text-[10px] text-slate-500">#F8FAFC</div>
                <div className="text-[10px] text-slate-500 mt-1">Nền sáng dịu mắt ngoài trời</div>
              </div>
              <div className="p-3 rounded-xl bg-white text-slate-800 border border-slate-200 shadow-xs">
                <div className="font-bold">Card Surface</div>
                <div className="text-[10px] text-slate-500">#FFFFFF</div>
                <div className="text-[10px] text-slate-500 mt-1">Bề mặt thẻ công việc & form</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">Quy Chuẩn Ergonomics & Typography</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li>• <strong>Touch Target:</strong> Tối thiểu 48x48px (min-h-[44px] - 48px) cho tất cả các nút bấm, icon thao tác và checkbox.</li>
              <li>• <strong>Typography:</strong> Plus Jakarta Sans. Tiêu đề đậm (font-bold/black), tương phản WCAG AAA đối với ánh sáng nắng gắt.</li>
              <li>• <strong>Bo góc (Border Radius):</strong> rounded-2xl (16px) cho thẻ, rounded-xl (12px) cho nút bấm, rounded-3xl cho Drawer.</li>
              <li>• <strong>Một tay thao tác:</strong> Nút gọi nhanh điện thoại và chỉ đường Maps luôn nằm ở vùng ngón cái dễ chạm.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 2. COMPONENT LIBRARY */}
      {tab === 'COMPONENTS' && (
        <div className="space-y-4 text-xs">
          <div>
            <div className="font-bold text-slate-800 mb-2">1. Hệ thống Nút bấm (Button Variants)</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="teal" size="sm">Teal Action</Button>
              <Button variant="navy" size="sm">Navy Brand</Button>
              <Button variant="outline" size="sm">Outline Secondary</Button>
              <Button variant="success" size="sm">Success Payout</Button>
              <Button variant="danger" size="sm">Danger Cancel</Button>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-800 mb-2">2. Huy hiệu Trạng thái (Status Badges)</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="navy">Đơn mới</Badge>
              <Badge variant="warning">Đang di chuyển</Badge>
              <Badge variant="teal">Đang kiểm tra</Badge>
              <Badge variant="success">Hoàn thành</Badge>
              <Badge variant="danger">Khẩn cấp</Badge>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">3. Form Input Tiêu chuẩn</div>
            <p className="text-slate-500">
              Có label rõ ràng, icon chỉ dẫn, thông báo lỗi bằng tiếng Việt, viền teal khi focus.
            </p>
          </div>
        </div>
      )}

      {/* 3. WIREFRAMES */}
      {tab === 'WIREFRAMES' && (
        <div className="space-y-3 text-xs">
          <div className="border border-slate-200 rounded-xl p-3 bg-white">
            <div className="font-bold text-[#0a1e3f] text-sm flex items-center gap-1.5 mb-1">
              <Smartphone className="w-4 h-4 text-[#0d9488]" />
              Wireframe Màn Hình Thợ: "Hôm nay làm gì"
            </div>
            <p className="text-slate-600 leading-relaxed">
              [Top Header: Chào Thợ + Ngày + 3 Chỉ số (Tổng đơn, Đang xử lý, Tạm tính thu nhập)]<br />
              [Tab Filter: Tất cả | Đang làm | Chờ nhận | Đã xong]<br />
              [Danh sách Job Cards thực dụng]:<br />
              &nbsp;&nbsp;• Giờ hẹn + Khoảng cách km<br />
              &nbsp;&nbsp;• Tên khách hàng + Nút gọi 1-chạm + Nút mở Google Maps<br />
              &nbsp;&nbsp;• Tên máy: Daikin Inverter 1.5HP + Thẻ bệnh (Chảy nước, kém lạnh)<br />
              &nbsp;&nbsp;• Nút hành động chính theo trạng thái: "Nhận việc & Xuất phát" &rarr; "Đã tới" &rarr; "Lập báo giá" &rarr; "Thu tiền"
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-white">
            <div className="font-bold text-[#0a1e3f] text-sm flex items-center gap-1.5 mb-1">
              <Smartphone className="w-4 h-4 text-[#0d9488]" />
              Wireframe Màn Hình Khách Hàng: "Đặt Lịch & Theo Dõi"
            </div>
            <p className="text-slate-600 leading-relaxed">
              [Bước 1: Chọn dịch vụ (Vệ sinh, Bổ sung gas, Sửa máy, Đo tổng quát) + Số lượng máy]<br />
              [Bước 2: Nhập địa chỉ, Hãng máy, SĐT liên hệ có xác thực định dạng]<br />
              [Bước 3: Chọn giờ hẹn + Bảng tính giá minh bạch 100% không phí ẩn]<br />
              [Màn Theo Dõi Trực Tiếp: Hiển thị thợ phụ trách, cự ly và trạng thái thời gian thực]
            </p>
          </div>
        </div>
      )}

      {/* 4. CHECKLIST UI/UX */}
      {tab === 'CHECKLIST' && (
        <div className="space-y-2 text-xs">
          {[
            { label: 'Viewport 360px+ không bị tràn ngang (overflow-x hidden)', ok: true },
            { label: 'Touch targets đạt tối thiểu 44px - 48px cho thao tác 1 tay', ok: true },
            { label: 'Bảng màu Trắng/Xám nhạt + Navy + Action Teal đúng yêu cầu', ok: true },
            { label: 'Hỗ trợ trạng thái Loading, Empty State, Error Form tiếng Việt', ok: true },
            { label: 'Chế độ mô phỏng Ngoại tuyến (Offline mode toggle & sync banner)', ok: true },
            { label: 'Quy trình công việc thợ 6 bước (State Machine + Unit test)', ok: true },
            { label: 'Biên nhận điện tử & Mã VietQR thanh toán tự động tính tiền', ok: true },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between"
            >
              <span className="font-medium text-emerald-900">{item.label}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
