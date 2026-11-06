import React, { useState, useEffect } from 'react';
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
  X,
  ExternalLink,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { Customer, Property, Device, StaffUser, Organization } from '../../lib/types';
import { Button } from '../ui/Button';

interface CustomersViewProps {
  currentOrg: Organization;
  customers: Customer[];
  properties: Property[];
  devices: Device[];
  currentUser: StaffUser;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onSelectCustomerDetail?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
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
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Form states for new customer
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Reset when org switches
  useEffect(() => {
    setSelectedCustomerId(null);
    setIsMobileDetailOpen(false);
    setSearchQuery('');
    setIsCreateModalOpen(false);
  }, [currentOrg.id]);

  // Isolate by tenant organization
  const tenantCustomers = customers.filter((c) => c.organizationId === currentOrg.id);
  const tenantProperties = properties.filter((p) => p.organizationId === currentOrg.id);
  const tenantDevices = devices.filter((d) => d.organizationId === currentOrg.id);

  const filteredCustomers = tenantCustomers.filter((c) => {
    if (c.isArchived !== filterArchived) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // Auto-select first customer on desktop if none selected
  useEffect(() => {
    if (!selectedCustomerId && filteredCustomers.length > 0) {
      setSelectedCustomerId(filteredCustomers[0].id);
    }
  }, [filteredCustomers, selectedCustomerId]);

  const selectedCustomer = tenantCustomers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0];
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
    setSelectedCustomerId(created.id);
    setIsCreateModalOpen(false);
    setNewFullName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. COMPACT PURPOSEFUL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Khách hàng
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {tenantCustomers.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý tập trung hồ sơ khách hàng, địa điểm và danh sách máy lạnh.
          </p>
        </div>

        <Button
          variant="teal"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khách hàng</span>
        </Button>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Segmented active/archive control */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setFilterArchived(false);
              setSelectedCustomerId(null);
            }}
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
            onClick={() => {
              setFilterArchived(true);
              setSelectedCustomerId(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterArchived
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã lưu trữ ({tenantCustomers.filter((c) => c.isArchived).length})
          </button>
        </div>

        {/* Search input with 14px legible text */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900 placeholder-slate-400 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* 3. SPLIT PANE WORKSPACE (Desktop: List + Detail Pane; Mobile: Scannable Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1">
        {/* LEFT COLUMN: Customer Cards List (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              Không tìm thấy khách hàng nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              const propsCount = tenantProperties.filter((p) => p.customerId === cust.id).length;
              const devsCount = tenantDevices.filter((d) => d.customerId === cust.id).length;

              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomerId(cust.id);
                    // On mobile (screen < 1024px), open detail sheet
                    if (window.innerWidth < 1024) {
                      setIsMobileDetailOpen(true);
                    }
                  }}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-teal-50/40 border-teal-600 shadow-xs ring-1 ring-teal-600'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Clean Initials Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0 border border-slate-200/60">
                        {cust.fullName.charAt(0)}
                      </div>

                      {/* Name & Phone */}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-base leading-snug truncate">
                          {cust.fullName}
                        </div>
                        <div className="text-sm font-mono text-slate-500 mt-0.5">
                          {cust.phone}
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Mobile Direct Dial Button */}
                      <a
                        href={`tel:${cust.phone.replace(/\s+/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Gọi ${cust.fullName}`}
                        className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors border border-emerald-200/60 lg:hidden"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      <div className="hidden lg:block text-right text-xs text-slate-500">
                        <div>
                          <strong className="text-slate-700 font-mono">{devsCount}</strong> máy lạnh
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {propsCount} địa chỉ
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Field note if available (subtle inline) */}
                  {cust.notes && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 line-clamp-1">
                      <span className="text-slate-400 font-medium mr-1">Ghi chú:</span>
                      {cust.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Desktop Rich Detail Pane (lg:col-span-7) */}
        <div className="hidden lg:block lg:col-span-7">
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6 sticky top-20">
              {/* Detail Pane Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-800 font-bold flex items-center justify-center text-lg border border-teal-200/80">
                    {selectedCustomer.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {selectedCustomer.fullName}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-mono mt-1">
                      <span className="font-semibold text-slate-900">{selectedCustomer.phone}</span>
                      {selectedCustomer.email && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 font-sans">{selectedCustomer.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
                    className="h-9 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200/70 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Gọi điện</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleArchive(selectedCustomer)}
                    className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {selectedCustomer.isArchived ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        <span>Lưu trữ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Service & Access Notes Callout */}
              {selectedCustomer.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-900 uppercase tracking-wide text-[11px]">
                    Lưu ý điều phối & kỹ thuật:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* SECTION: Properties (Địa điểm bất động sản) */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  <span>Địa điểm ({customerProperties.length})</span>
                </div>

                {customerProperties.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Chưa có địa điểm bất động sản nào được liên kết.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-900">{prop.label}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${prop.address}, ${prop.district}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-700 hover:underline flex items-center gap-1"
                          >
                            <span>Bản đồ</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{prop.address}, {prop.district}</span>
                        </div>

                        {prop.accessNotes && (
                          <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                            <strong>Lưu ý tiếp cận:</strong> {prop.accessNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: Devices (Thiết bị máy lạnh & QR) */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  <span>Máy lạnh đã đăng ký ({customerDevices.length})</span>
                </div>

                {customerDevices.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Chưa có thiết bị máy lạnh nào được đăng ký.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerDevices.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              {dev.brand} {dev.horsePower}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                              Gas {dev.gasType}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 font-mono">
                            Model: {dev.modelCode} · Vị trí: {dev.indoorUnitLocation}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-medium border border-slate-200">
                            <QrCode className="w-3.5 h-3.5 text-slate-600" />
                            {dev.neutralQrCode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 text-sm">
              Chọn một khách hàng ở danh sách bên trái để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* 4. MOBILE DETAIL SHEET (Opens on mobile when a customer card is clicked) */}
      {isMobileDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end lg:hidden animate-fadeIn">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-5 animate-slideUp">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {selectedCustomer.fullName}
                </h2>
                <div className="text-sm font-mono text-slate-600 font-semibold mt-0.5">
                  {selectedCustomer.phone}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDetailOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Call Button (Thumb Zone) */}
            <a
              href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
              className="h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi điện cho khách</span>
            </a>

            {/* Properties */}
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Địa điểm ({customerProperties.length})
              </div>
              {customerProperties.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 mb-2">
                  <div className="font-bold text-slate-900">{p.label}</div>
                  <div className="text-slate-600">{p.address}, {p.district}</div>
                  {p.accessNotes && (
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-900 mt-1">
                      Lưu ý: {p.accessNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Devices */}
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Máy lạnh ({customerDevices.length})
              </div>
              {customerDevices.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-slate-900">{d.brand} {d.horsePower}</div>
                    <div className="text-slate-500 text-[11px] font-mono">QR: {d.neutralQrCode}</div>
                  </div>
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    Gas {d.gasType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE CUSTOMER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Thêm Khách Hàng Mới
            </h2>
            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên khách hàng *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ví dụ: Chị Nguyễn Thị Lan"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (tùy chọn)
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="khachhang@example.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú điều phối (chung cư, giờ liên hệ)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Lưu ý tiếp cận nhà, thói quen hẹn giờ..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
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
