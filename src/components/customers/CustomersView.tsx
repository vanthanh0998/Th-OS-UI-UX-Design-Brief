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
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Customer, Property, Device, StaffUser } from '../../lib/types';
import { Button } from '../ui/Button';

interface CustomersViewProps {
  customers: Customer[];
  properties: Property[];
  devices: Device[];
  currentUser: StaffUser;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onSelectCustomerDetail?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
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

  // Form states for new customer
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (c.isArchived !== filterArchived) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerProperties = selectedCustomer
    ? properties.filter((p) => p.customerId === selectedCustomer.id)
    : [];
  const customerDevices = selectedCustomer
    ? devices.filter((d) => d.customerId === selectedCustomer.id)
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
      organizationId: currentUser.organizationId,
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
      {/* Top Action & Search Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Danh bạ Khách hàng (Customers Directory)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hồ sơ khách hàng, tra cứu nhanh số điện thoại và lưu trữ hồ sơ cũ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setFilterArchived(!filterArchived)}
            className="text-xs"
          >
            {filterArchived ? <RotateCcw className="w-3.5 h-3.5 mr-1" /> : <Archive className="w-3.5 h-3.5 mr-1" />}
            {filterArchived ? 'Xem khách đang hoạt động' : 'Kho lưu trữ (Archived)'}
          </Button>

          <Button
            variant="teal"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-1" /> Thêm khách hàng
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tên khách hàng hoặc số điện thoại (VD: 0908...)"
          className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
        />
      </div>

      {/* Main Grid: List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Customer List */}
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-2.5`}>
          {filteredCustomers.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Không tìm thấy khách hàng nào phù hợp với điều kiện tìm kiếm.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = cust.id === selectedCustomerId;
              const propsCount = properties.filter((p) => p.customerId === cust.id).length;
              const devsCount = devices.filter((d) => d.customerId === cust.id).length;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#0d9488] ring-2 ring-[#0d9488]/15 bg-teal-50/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{cust.fullName}</h4>
                        {cust.isArchived && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            Đã lưu trữ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{cust.phone}</span>
                        {cust.email && <span>• {cust.email}</span>}
                      </div>
                      {cust.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          {cust.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {propsCount} địa điểm • {devsCount} máy
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {cust.totalServiceOrders || 0} đơn dịch vụ
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Customer Detail Panel */}
        {selectedCustomer && (
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wide">Chi tiết khách hàng</span>
                <h3 className="font-black text-base text-slate-900">{selectedCustomer.fullName}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-teal-600" /> Số điện thoại:</span>
                <span className="font-bold text-slate-900">{selectedCustomer.phone}</span>
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-teal-600" /> Email:</span>
                  <span className="font-semibold text-slate-700">{selectedCustomer.email}</span>
                </div>
              )}
            </div>

            {/* Properties of this customer */}
            <div>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0d9488]" />
                Địa điểm / Bất động sản ({customerProperties.length})
              </h5>
              <div className="space-y-2">
                {customerProperties.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                    Chưa có địa điểm nào được liên kết
                  </div>
                ) : (
                  customerProperties.map((p) => (
                    <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <div className="font-bold text-slate-900">{p.label}</div>
                      <div className="text-slate-600 text-[11px] mt-0.5">{p.address}, {p.district}</div>
                      {p.accessNotes && (
                        <div className="text-[10px] text-amber-800 bg-amber-50 p-1 rounded mt-1">
                          Lưu ý: {p.accessNotes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Devices of this customer */}
            <div>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Airplay className="w-3.5 h-3.5 text-[#0d9488]" />
                Thiết bị máy lạnh ({customerDevices.length})
              </h5>
              <div className="space-y-2">
                {customerDevices.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                    Chưa có thiết bị nào thuộc khách hàng này
                  </div>
                ) : (
                  customerDevices.map((d) => (
                    <div key={d.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{d.brand} {d.horsePower}</div>
                        <div className="text-[11px] text-slate-500">
                          {d.indoorUnitLocation} • Gas {d.gasType}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-teal-700">
                        {d.neutralQrCode}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Button
                variant={selectedCustomer.isArchived ? 'teal' : 'outline'}
                size="sm"
                fullWidth
                onClick={() => handleToggleArchive(selectedCustomer)}
              >
                {selectedCustomer.isArchived ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Khôi phục hoạt động
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 mr-1" /> Lưu trữ khách hàng
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Create Customer */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
            <div className="bg-[#0a1e3f] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Khách Hàng Mới</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="VD: Anh Tuấn, Chị Lan..."
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
                  placeholder="VD: 0908 123 456"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email (tùy chọn)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="VD: tuan.aircon@gmail.com"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú đặc thù</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="VD: Ưu tiên liên hệ sau 18h, nhà có thú cưng..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setIsCreateModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="teal" size="md" type="submit">
                  Lưu Khách Hàng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
