import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  Airplay,
  Calendar,
  Wrench,
  Archive,
  RotateCcw,
  ChevronRight,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Customer, Property, Device, StaffUser, Organization } from '../../lib/types';
import { Button } from '../ui/Button';

interface CustomersVariantBProps {
  currentOrg: Organization;
  customers: Customer[];
  properties: Property[];
  devices: Device[];
  currentUser: StaffUser;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export const CustomersVariantB: React.FC<CustomersVariantBProps> = ({
  currentOrg,
  customers,
  properties,
  devices,
  currentUser,
  onAddCustomer,
  onUpdateCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArchived, setFilterArchived] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const tenantCustomers = customers.filter((c) => c.organizationId === currentOrg.id);
  const tenantProperties = properties.filter((p) => p.organizationId === currentOrg.id);
  const tenantDevices = devices.filter((d) => d.organizationId === currentOrg.id);

  const filteredCustomers = tenantCustomers.filter((c) => {
    if (c.isArchived !== filterArchived) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const selectedCustomer = tenantCustomers.find((c) => c.id === selectedCustomerId);
  const customerProperties = selectedCustomer
    ? tenantProperties.filter((p) => p.customerId === selectedCustomer.id)
    : [];
  const customerDevices = selectedCustomer
    ? tenantDevices.filter((d) => d.customerId === selectedCustomer.id)
    : [];

  const handleToggleArchive = (customer: Customer) => {
    onUpdateCustomer({
      ...customer,
      isArchived: !customer.isArchived,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) return;

    const created: Customer = {
      id: `cust-${Date.now()}`,
      organizationId: currentOrg.id,
      fullName: newFullName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      notes: newNotes.trim() || undefined,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      propertiesCount: 0,
      devicesCount: 0,
      totalServiceOrders: 0,
    };

    onAddCustomer(created);
    setIsCreateModalOpen(false);
    setNewFullName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* FIELD SERVICE DIRECTORY HEADER */}
      <div className="bg-[#0a1e3f] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Danh bạ liên lạc nhanh hiện trường
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              Khách hàng ({tenantCustomers.length})
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Tra cứu nhanh số điện thoại, địa chỉ nhà và thông tin kỹ thuật máy lạnh phục vụ thợ trên đường.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-11 px-4 rounded-xl bg-[#0d9488] hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khách mới</span>
          </button>
        </div>

        {/* Big Search Bar for Mobile Thumb */}
        <div className="mt-4 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Gõ tên hoặc số điện thoại để gọi ngay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all font-medium"
          />
        </div>
      </div>

      {/* SEGMENTED TOGGLE (Hoạt động / Đã lưu trữ) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterArchived(false)}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            !filterArchived
              ? 'bg-[#0a1e3f] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Đang hoạt động ({tenantCustomers.filter((c) => !c.isArchived).length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterArchived(true)}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterArchived
              ? 'bg-[#0a1e3f] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Lưu trữ ({tenantCustomers.filter((c) => c.isArchived).length})</span>
        </button>
      </div>

      {/* FIELD CUSTOMER CARDS WITH 1-TAP CALL & MAP */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            Không tìm thấy thông tin khách hàng nào.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const props = tenantProperties.filter((p) => p.customerId === cust.id);
            const primaryProp = props[0];
            const devs = tenantDevices.filter((d) => d.customerId === cust.id);
            const isExpanded = selectedCustomerId === cust.id;

            return (
              <div
                key={cust.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                  isExpanded ? 'border-teal-600 ring-1 ring-teal-600' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {cust.fullName}
                      </h3>
                      {cust.isArchived && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Đã lưu trữ
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-teal-800 font-mono">
                      {cust.phone}
                    </div>

                    {primaryProp && (
                      <div className="text-xs text-slate-600 flex items-start gap-1 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{primaryProp.address}, {primaryProp.district}</span>
                      </div>
                    )}

                    {primaryProp?.accessNotes && (
                      <div className="p-2 bg-amber-50/80 border border-amber-200/60 rounded-lg text-[11px] text-amber-900 font-medium mt-1">
                        Lưu ý thợ: {primaryProp.accessNotes}
                      </div>
                    )}
                  </div>

                  {/* 1-Tap Thumb Action on Right */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${cust.phone.replace(/\s+/g, '')}`}
                      aria-label={`Gọi khách ${cust.fullName}`}
                      className="w-11 h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center shadow-xs active:scale-95 transition-transform"
                    >
                      <Phone className="w-5 h-5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(isExpanded ? null : cust.id)}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                      aria-label="Xem chi tiết máy lạnh"
                    >
                      <ChevronRight
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Machine count summary tag */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Airplay className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      {devs.length} máy lạnh đã lưu
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleArchive(cust)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    {cust.isArchived ? 'Khôi phục' : 'Lưu trữ'}
                  </button>
                </div>

                {/* Expanded Devices Drawer (When opened) */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-2 bg-slate-50/80 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-4 sm:p-5 rounded-b-2xl animate-fadeIn">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Danh sách máy lạnh ({devs.length}):
                    </div>
                    {devs.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">Chưa có máy lạnh nào được đăng ký.</div>
                    ) : (
                      devs.map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{d.brand} {d.horsePower}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Mã QR: {d.neutralQrCode} · Vị trí: {d.indoorUnitLocation}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            Gas {d.gasType}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-black text-slate-900">
              Thêm Khách Hàng Mới
            </h2>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ví dụ: Anh Nguyễn Văn Bình"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú điều phối (chung cư, giờ liên hệ)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Lưu ý tiếp cận nhà, người nhận máy..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="teal" size="sm" type="submit">
                  Lưu khách hàng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
