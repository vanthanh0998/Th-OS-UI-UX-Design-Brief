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
  ShieldCheck,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { Customer, Property, Device, StaffUser, Organization } from '../../lib/types';
import { filterByTenant } from '../../lib/tenant-isolation';
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
  const [copiedPhone, setCopiedPhone] = useState(false);

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

  // Isolate by tenant organization (P0 Tenant Isolation)
  const tenantCustomers = filterByTenant(customers, currentOrg.id);
  const tenantProperties = filterByTenant(properties, currentOrg.id);
  const tenantDevices = filterByTenant(devices, currentOrg.id);

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

  const selectedCustomer =
    tenantCustomers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0];

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

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. PURPOSEFUL PAGE HEADING & ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Danh bạ Khách hàng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
              {tenantCustomers.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Hồ sơ khách hàng, sổ tay địa chỉ và quản lý máy lạnh gắn mã QR định danh.
          </p>
        </div>

        <Button
          variant="teal"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto flex items-center gap-2 shadow-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khách hàng</span>
        </Button>
      </div>

      {/* 2. SEARCH & SEGMENTED FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented active / archived tabs */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setFilterArchived(false);
              setSelectedCustomerId(null);
            }}
            className={`px-3.5 py-1.5 text-xs rounded-lg transition-all ${
              !filterArchived
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
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
            className={`px-3.5 py-1.5 text-xs rounded-lg transition-all ${
              filterArchived
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Đã lưu trữ ({tenantCustomers.filter((c) => c.isArchived).length})
          </button>
        </div>

        {/* Quick Search Input */}
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

      {/* 3. HIGH-END CRM WORKSPACE (Desktop: High-Density List 38% + CRM Dossier 62%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: High-Density Customer List (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-2">
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
                    // On mobile, open rich bottom sheet drawer
                    if (window.innerWidth < 1024) {
                      setIsMobileDetailOpen(true);
                    }
                  }}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/30 shadow-xs ring-1 ring-teal-500/20'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Compact Avatar Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                          isSelected
                            ? 'bg-[#0a1e3f] text-teal-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                        }`}
                      >
                        {cust.fullName.charAt(0)}
                      </div>

                      {/* Name & Phone & Equipment count */}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm leading-snug truncate">
                          {cust.fullName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="font-mono font-medium">{cust.phone}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-teal-700 font-semibold">{devsCount} máy lạnh</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: 1-Tap Call & Detail indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${cust.phone.replace(/\s+/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Gọi điện cho ${cust.fullName}`}
                        className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors border border-emerald-200/60"
                        title="Gọi điện nhanh"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Desktop CRM Customer Dossier (lg:col-span-7) */}
        <div className="hidden lg:block lg:col-span-7">
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6 sticky top-20">
              {/* 3.1. Customer Dossier Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0a1e3f] text-[#14b8a6] flex items-center justify-center font-black text-lg shadow-xs">
                    {selectedCustomer.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">
                        {selectedCustomer.fullName}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          selectedCustomer.isArchived
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {selectedCustomer.isArchived ? 'Đã lưu trữ' : 'Đang hoạt động'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>{selectedCustomer.phone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(selectedCustomer.phone)}
                          className="ml-1 text-slate-400 hover:text-slate-700"
                          title="Sao chép số điện thoại"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedPhone && <span className="text-teal-600 font-sans text-[10px]">Đã chép!</span>}
                      </div>

                      {selectedCustomer.email && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions in Dossier Header */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi điện</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleArchive(selectedCustomer)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title={selectedCustomer.isArchived ? 'Kích hoạt lại' : 'Lưu trữ hồ sơ'}
                  >
                    {selectedCustomer.isArchived ? (
                      <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* 3.2. Properties & Access Notes Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Địa điểm & Hướng dẫn tiếp cận ({customerProperties.length})</span>
                  </h3>
                </div>

                {customerProperties.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500 italic">
                    Chưa có địa chỉ nào được gán cho khách hàng này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{prop.label}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${prop.address}, ${prop.district}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 text-[11px]"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-slate-600">{prop.address}, {prop.district}, {prop.city}</div>
                        {prop.accessNotes && (
                          <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60 font-medium text-[11px]">
                            Lưu ý tiếp cận: {prop.accessNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3.3. Equipment Registry (Mã QR & Danh mục máy) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Airplay className="w-3.5 h-3.5 text-teal-600" />
                    <span>Hồ sơ Máy lạnh & Mã QR ({customerDevices.length})</span>
                  </h3>
                </div>

                {customerDevices.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500 italic">
                    Chưa đăng ký thiết bị nào dưới tên khách hàng này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customerDevices.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{dev.brand} {dev.horsePower}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-700">
                            Gas {dev.gasType}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Vị trí: <strong className="text-slate-800 font-medium">{dev.indoorUnitLocation}</strong>
                        </div>
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-mono text-teal-800 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">
                            {dev.neutralQrCode}
                          </span>
                          <span className="text-slate-400">
                            {dev.airconType === 'AM_TRAN' ? 'Âm trần' : 'Treo tường'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3.4. Field Notes */}
              {selectedCustomer.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 block">Ghi chú điều phối:</span>
                  <p className="leading-relaxed text-slate-600">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              Chọn một khách hàng ở danh sách bên trái để xem hồ sơ chi tiết CRM.
            </div>
          )}
        </div>
      </div>

      {/* 4. MOBILE DETAIL BOTTOM SHEET / FULL-SCREEN DRAWER */}
      {isMobileDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-5 animate-slideUp">
            {/* Sheet Handle & Close Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0a1e3f] text-[#14b8a6] flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedCustomer.fullName}</h3>
                  <div className="text-xs font-mono text-slate-500">{selectedCustomer.phone}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDetailOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Direct Call Bar on Mobile */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
                className="h-11 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Gọi điện thoại</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopyPhone(selectedCustomer.phone)}
                className="h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 bg-slate-50"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>{copiedPhone ? 'Đã sao chép!' : 'Chép số'}</span>
              </button>
            </div>

            {/* Properties */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Địa điểm ({customerProperties.length})
              </h4>
              {customerProperties.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{p.label}</div>
                  <div className="text-slate-600">{p.address}, {p.district}</div>
                  {p.accessNotes && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded font-medium">
                      Lưu ý: {p.accessNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Devices */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thiết bị máy lạnh ({customerDevices.length})
              </h4>
              {customerDevices.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{d.brand} {d.horsePower}</span>
                    <span className="font-mono text-teal-800 font-semibold">{d.neutralQrCode}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Vị trí: {d.indoorUnitLocation}</div>
                </div>
              ))}
            </div>

            {/* Close */}
            <Button variant="ghost" size="md" fullWidth onClick={() => setIsMobileDetailOpen(false)}>
              Đóng hồ sơ
            </Button>
          </div>
        </div>
      )}

      {/* 5. CREATE CUSTOMER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
            <div className="bg-[#0a1e3f] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0d9488] flex items-center justify-center text-white font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Thêm Khách hàng Mới</h3>
                  <p className="text-xs text-slate-300">Tổ chức: {currentOrg.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Họ và tên khách hàng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chị Mai Lan"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0908 123 456"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Email (tùy chọn)
                </label>
                <input
                  type="email"
                  placeholder="mailan.ng@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Ghi chú điều phối (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Nhà có trẻ sơ sinh, ưu tiên làm buổi sáng"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="md" fullWidth onClick={() => setIsCreateModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="teal" size="md" fullWidth type="submit">
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
