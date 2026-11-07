import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  // ESC key and body scroll lock for modals & bottom sheets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        if (isMobileDetailOpen) setIsMobileDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (isCreateModalOpen || isMobileDetailOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCreateModalOpen, isMobileDetailOpen]);

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
      {/* 1. PURPOSEFUL PAGE HEADING & QUICK ACTION TOOLBAR */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">
            Danh bạ Khách hàng
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
            Hồ sơ khách hàng, sổ tay địa chỉ và quản lý máy lạnh gắn mã QR ({tenantCustomers.length} liên hệ).
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-1.5 shadow-xs font-bold text-xs sm:text-sm h-10 px-3.5 sm:px-4 rounded-xl bg-[#0d9488] hover:bg-teal-700 active:bg-teal-800 text-white shrink-0 whitespace-nowrap min-w-[44px] min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Thêm khách hàng</span>
          <span className="sm:hidden font-bold">Thêm</span>
        </motion.button>
      </div>

      {/* 1.1. REFINED EDITORIAL KPI STRIP (Hidden on mobile to eliminate clutter and prioritize list) */}
      <div className="hidden sm:flex items-center justify-between px-5 py-3 bg-white rounded-xl border border-slate-200/80 shadow-xs divide-x divide-slate-100">
        <div className="flex-1 px-4 first:pl-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng khách hàng</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
              {tenantCustomers.length}
            </span>
            <span className="text-xs text-slate-400">hồ sơ cơ sở</span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Thiết bị quản lý</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-teal-700 font-mono tracking-tight tabular-nums">
              {tenantDevices.length}
            </span>
            <span className="text-xs text-teal-700/80">đã dán mã QR</span>
          </div>
        </div>

        <div className="flex-1 px-4 last:pr-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Căn hộ & Điểm lắp</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
              {tenantProperties.length}
            </span>
            <span className="text-xs text-slate-400">sổ tay địa chỉ</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & SEGMENTED FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        {/* Segmented active / archived tabs */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setFilterArchived(false);
              setSelectedCustomerId(null);
            }}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
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
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
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

      {/* 3. HIGH-END CRM WORKSPACE (Desktop: High-Density List 40% + CRM Dossier 60%) */}
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
                <motion.div
                  key={cust.id}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => {
                    setSelectedCustomerId(cust.id);
                    // On mobile, open rich bottom sheet drawer
                    if (window.innerWidth < 1024) {
                      setIsMobileDetailOpen(true);
                    }
                  }}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-colors cursor-pointer relative ${
                    isSelected
                      ? 'border-teal-500/80 bg-teal-50/40 shadow-xs ring-1 ring-teal-500/20'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Compact Avatar Badge */}
                      <div
                        className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                          isSelected
                            ? 'bg-[#0a1e3f] text-teal-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                        }`}
                      >
                        {cust.fullName.charAt(0)}
                      </div>

                      {/* Name & Phone & Equipment count - Legible Typography */}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                          {cust.fullName}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                          <span className="font-mono font-medium tracking-tight whitespace-nowrap">{cust.phone}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-teal-700 font-semibold whitespace-nowrap">{devsCount} máy lạnh</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: 1-Tap Call (Target >= 44-48px) & Detail indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${cust.phone.replace(/\s+/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Gọi điện cho ${cust.fullName}`}
                        className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 flex items-center justify-center transition-colors border border-emerald-200/70 shadow-xs shrink-0"
                        title="Gọi điện nhanh"
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                      </a>

                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Desktop CRM Customer Dossier (lg:col-span-7) */}
        <div className="hidden lg:block lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div
                key={selectedCustomer.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5 sticky top-20"
              >
              {/* 3.1. Customer Dossier Header (Redesigned for 1024px, 1280px, 1440px) */}
              <div className="pb-4 border-b border-slate-100 space-y-3.5">
                {/* Top Row: Avatar, Name, Status & Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#0a1e3f] text-[#14b8a6] flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                      {selectedCustomer.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">
                          {selectedCustomer.fullName}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shrink-0 ${
                            selectedCustomer.isArchived
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {selectedCustomer.isArchived ? 'Đã lưu trữ' : 'Đang hoạt động'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Mã hồ sơ: <span className="font-mono text-slate-600 font-medium">#{selectedCustomer.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar: Dedicated row with whitespace-nowrap, never wraps mid-word */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <a
                      href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
                      className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Gọi điện</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleToggleArchive(selectedCustomer)}
                      className="h-9 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      title={selectedCustomer.isArchived ? 'Kích hoạt lại' : 'Lưu trữ hồ sơ'}
                    >
                      {selectedCustomer.isArchived ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="whitespace-nowrap">Kích hoạt</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="whitespace-nowrap">Lưu trữ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-row: Contact Pills (Phone in dedicated pill, never wraps mid-digits) */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                  {/* Phone Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold whitespace-nowrap shrink-0">
                    <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="whitespace-nowrap tracking-tight">{selectedCustomer.phone}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(selectedCustomer.phone)}
                      className="ml-1 p-0.5 text-slate-400 hover:text-slate-700 active:text-teal-700 transition-colors"
                      title="Sao chép số điện thoại"
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    {copiedPhone && <span className="text-teal-600 font-sans text-[11px] font-bold ml-1">Đã chép!</span>}
                  </div>

                  {/* Email Pill */}
                  {selectedCustomer.email && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 whitespace-nowrap shrink-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="whitespace-nowrap">{selectedCustomer.email}</span>
                    </div>
                  )}
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
                  <div className="space-y-2.5">
                    {customerProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{prop.label}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${prop.address}, ${prop.district}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 text-xs"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="text-slate-600 text-xs">{prop.address}, {prop.district}, {prop.city}</div>
                        {prop.accessNotes && (
                          <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60 font-medium text-xs">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customerDevices.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{dev.brand} {dev.horsePower}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono font-bold text-slate-700">
                            Gas {dev.gasType}
                          </span>
                        </div>
                        <div className="text-slate-600 text-xs">
                          Vị trí: <strong className="text-slate-800 font-medium">{dev.indoorUnitLocation}</strong>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-mono text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                            {dev.neutralQrCode}
                          </span>
                          <span className="text-slate-500">
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
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 block">Ghi chú điều phối:</span>
                  <p className="leading-relaxed text-slate-600">{selectedCustomer.notes}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              Chọn một khách hàng ở danh sách bên trái để xem hồ sơ chi tiết CRM.
            </div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. MOBILE DETAIL BOTTOM SHEET / FULL-SCREEN DRAWER (Ergonomic for 360px - 430px) */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setIsMobileDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 380 }}
              className="relative z-10 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-5 border-t border-slate-200 shadow-2xl"
            >
              {/* Sheet Handle & Close Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a1e3f] text-[#14b8a6] flex items-center justify-center font-bold text-base">
                    {selectedCustomer.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-tight">{selectedCustomer.fullName}</h3>
                    <div className="text-xs font-mono font-semibold text-slate-500 mt-0.5">{selectedCustomer.phone}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDetailOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center font-bold text-base transition-colors"
                  aria-label="Đóng chi tiết"
                >
                  ✕
                </button>
              </div>

              {/* Direct Call Bar on Mobile (Thumb zone >= 48px) */}
              <div className="grid grid-cols-2 gap-2.5">
                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href={`tel:${selectedCustomer.phone.replace(/\s+/g, '')}`}
                  className="h-12 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Gọi điện</span>
                </motion.a>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => handleCopyPhone(selectedCustomer.phone)}
                  className="h-12 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 bg-slate-50 active:bg-slate-100"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>{copiedPhone ? 'Đã sao chép!' : 'Chép số'}</span>
                </motion.button>
              </div>

              {/* Properties */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Địa điểm căn hộ ({customerProperties.length})
                </h4>
                {customerProperties.map((p) => (
                  <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 text-sm">{p.label}</div>
                    <div className="text-slate-600 text-xs">{p.address}, {p.district}</div>
                    {p.accessNotes && (
                      <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg font-medium border border-amber-200/60">
                        Lưu ý: {p.accessNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Devices */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thiết bị máy lạnh ({customerDevices.length})
                </h4>
                {customerDevices.map((d) => (
                  <div key={d.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">{d.brand} {d.horsePower}</span>
                      <span className="font-mono text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                        {d.neutralQrCode}
                      </span>
                    </div>
                    <div className="text-slate-600 text-xs">Vị trí: {d.indoorUnitLocation}</div>
                  </div>
                ))}
              </div>

              {/* Close */}
              <Button variant="ghost" size="md" fullWidth onClick={() => setIsMobileDetailOpen(false)} className="h-11 font-semibold text-sm">
                Đóng hồ sơ
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CREATE CUSTOMER MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="relative z-10 bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
            >
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
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
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
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-600 transition-colors"
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
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-teal-600 transition-colors"
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
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-teal-600 transition-colors"
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition-colors"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
