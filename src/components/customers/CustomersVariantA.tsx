import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Archive,
  RotateCcw,
  Building,
  MapPin,
  ChevronRight,
  Airplay,
  Calendar,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { Customer, Property, Device, StaffUser, Organization } from '../../lib/types';
import { Button } from '../ui/Button';

interface CustomersVariantAProps {
  currentOrg: Organization;
  customers: Customer[];
  properties: Property[];
  devices: Device[];
  currentUser: StaffUser;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export const CustomersVariantA: React.FC<CustomersVariantAProps> = ({
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* SECTION 1: Clean Executive Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cơ sở dữ liệu khách hàng
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Danh bạ khách hàng ({tenantCustomers.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tập trung hồ sơ khách hàng, quyền sở hữu bất động sản và lịch sử máy lạnh.
          </p>
        </div>

        <Button
          variant="teal"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khách hàng</span>
        </Button>
      </div>

      {/* SECTION 2: Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setFilterArchived(false)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !filterArchived
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang hoạt động ({tenantCustomers.filter((c) => !c.isArchived).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterArchived(true)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterArchived
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã lưu trữ ({tenantCustomers.filter((c) => c.isArchived).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* SECTION 3: Customers Directory Grid & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Cards List */}
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              Không tìm thấy khách hàng nào.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomerId === cust.id;
              const propsCount = tenantProperties.filter((p) => p.customerId === cust.id).length;
              const devsCount = tenantDevices.filter((d) => d.customerId === cust.id).length;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 ring-1 ring-teal-600 shadow-sm'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {cust.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {cust.fullName}
                        </h3>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {cust.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="hidden sm:block text-right">
                        <div>
                          <strong className="text-slate-800 font-mono">{propsCount}</strong> địa điểm
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <strong className="text-slate-700 font-mono">{devsCount}</strong> máy lạnh
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isSelected ? 'rotate-90 text-teal-600' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {cust.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 line-clamp-1">
                      {cust.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Customer Detailed Workspace */}
        {selectedCustomer && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5 sticky top-28">
            <div className="flex items-start justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Hồ sơ chi tiết
                </span>
                <h2 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                  {selectedCustomer.fullName}
                </h2>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  {selectedCustomer.phone}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
                  className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
                  aria-label="Gọi điện"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleToggleArchive(selectedCustomer)}
                  title={selectedCustomer.isArchived ? 'Khôi phục' : 'Lưu trữ'}
                  className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
                >
                  {selectedCustomer.isArchived ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Properties List */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                <span>Địa điểm ({customerProperties.length})</span>
              </div>
              {customerProperties.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                  Chưa có địa điểm nào được liên kết.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerProperties.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-slate-900">{p.label}</div>
                      <div className="text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{p.address}, {p.district}</span>
                      </div>
                      {p.accessNotes && (
                        <div className="text-slate-500 text-[11px] pt-1">
                          Lưu ý: {p.accessNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Devices List */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                <span>Thiết bị máy lạnh ({customerDevices.length})</span>
              </div>
              {customerDevices.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                  Chưa đăng ký thiết bị máy lạnh.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerDevices.map((d) => (
                    <div key={d.id} className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">
                          {d.brand} • {d.horsePower}
                        </div>
                        <div className="text-slate-500 text-[11px] font-mono">
                          QR: {d.neutralQrCode} · Model: {d.modelCode}
                        </div>
                      </div>
                      <div className="text-slate-600 text-xs font-medium">
                        Gas {d.gasType}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Thêm Khách Hàng Mới
            </h2>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ví dụ: Chị Nguyễn Thị Lan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email (tùy chọn)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="khachhang@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ghi chú hồ sơ
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Thói quen gọi thợ, lưu ý hẹn giờ..."
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
