import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Building,
  User,
  Airplay,
  Search,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Property, Customer, Device, StaffUser } from '../../lib/types';
import { Button } from '../ui/Button';

interface PropertiesViewProps {
  properties: Property[];
  customers: Customer[];
  devices: Device[];
  currentUser: StaffUser;
  onAddProperty: (property: Property) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  customers,
  devices,
  currentUser,
  onAddProperty,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Quận 1');
  const [accessNotes, setAccessNotes] = useState('');

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cust = customers.find((c) => c.id === p.customerId);
    return (
      p.label.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      (cust && cust.fullName.toLowerCase().includes(q))
    );
  });

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !address.trim() || !selectedCustomerId) return;

    const created: Property = {
      id: `prop-${Date.now()}`,
      customerId: selectedCustomerId,
      organizationId: currentUser.organizationId,
      label: label.trim(),
      address: address.trim(),
      district,
      city: 'TP. Hồ Chí Minh',
      accessNotes: accessNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddProperty(created);
    setIsModalOpen(false);
    setLabel('');
    setAddress('');
    setAccessNotes('');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Địa điểm & Bất động sản (Properties)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý địa chỉ nhà, căn hộ dịch vụ và chỉ dẫn kỹ thuật vào vị trí dàn nóng/lạnh
          </p>
        </div>

        <Button variant="teal" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Thêm địa điểm mới
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên địa điểm, số nhà, quận hoặc tên chủ nhà..."
          className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
        />
      </div>

      {/* Grid of properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredProperties.map((prop) => {
          const owner = customers.find((c) => c.id === prop.customerId);
          const attachedDevices = devices.filter((d) => d.propertyId === prop.id);

          return (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {prop.district}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{prop.label}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{prop.address}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                    {attachedDevices.length} máy lạnh
                  </span>
                </div>
              </div>

              {/* Customer Link Bar */}
              <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-slate-500">Chủ sở hữu:</span>
                  <strong className="text-slate-800">{owner?.fullName || 'Khách vãng lai'}</strong>
                </div>
                {owner?.phone && (
                  <span className="font-semibold text-slate-600 text-[11px]">{owner.phone}</span>
                )}
              </div>

              {prop.accessNotes && (
                <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{prop.accessNotes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add Property */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
            <div className="bg-[#0a1e3f] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Bất Động Sản / Địa Điểm</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thuộc khách hàng *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên định danh địa điểm *</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="VD: Căn hộ Masteri T2-1402, Nhà riêng..."
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ cụ thể *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: 159 Xa Lộ Hà Nội, Phường Thảo Điền"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quận / Huyện *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                >
                  <option value="Quận 1">Quận 1</option>
                  <option value="Quận 3">Quận 3</option>
                  <option value="Quận 5">Quận 5</option>
                  <option value="Quận 7">Quận 7</option>
                  <option value="Bình Thạnh">Bình Thạnh</option>
                  <option value="Phú Nhuận">Phú Nhuận</option>
                  <option value="TP. Thủ Đức">TP. Thủ Đức</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chỉ dẫn kỹ thuật / tiếp cận</label>
                <textarea
                  rows={2}
                  value={accessNotes}
                  onChange={(e) => setAccessNotes(e.target.value)}
                  placeholder="VD: Thang máy cần thẻ từ tầng trệt, dàn nóng gắn ngoài lan can sân thượng..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="teal" size="md" type="submit">
                  Lưu Địa Điểm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
