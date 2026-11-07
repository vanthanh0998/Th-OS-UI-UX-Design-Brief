import React, { useState } from 'react';
import {
  Airplay,
  Plus,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Wrench,
  Snowflake,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Device, Customer, Property, AirconType, StaffUser } from '../../lib/types';
import { filterByTenant, validateDeviceTenantLink } from '../../lib/tenant-isolation';
import { Button } from '../ui/Button';

interface DevicesViewProps {
  devices: Device[];
  customers: Customer[];
  properties: Property[];
  currentUser: StaffUser;
  onAddDevice: (device: Device) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  customers,
  properties,
  currentUser,
  onAddDevice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeviceQr, setSelectedDeviceQr] = useState<Device | null>(null);
  const [formError, setFormError] = useState('');

  // P0 Tenant Isolation: Filter all entities strictly by currentUser.organizationId
  const currentOrgId = currentUser.organizationId;
  const tenantDevices = filterByTenant(devices, currentOrgId);
  const tenantCustomers = filterByTenant(customers, currentOrgId);
  const tenantProperties = filterByTenant(properties, currentOrgId);

  // Form states (initialized with tenant-scoped entities)
  const [customerId, setCustomerId] = useState(tenantCustomers[0]?.id || '');
  const availableProperties = tenantProperties.filter((p) => p.customerId === customerId);
  const [propertyId, setPropertyId] = useState(availableProperties[0]?.id || tenantProperties[0]?.id || '');
  const [brand, setBrand] = useState('Daikin');
  const [modelCode, setModelCode] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [horsePower, setHorsePower] = useState('1.0 HP');
  const [airconType, setAirconType] = useState<AirconType>('TREO_TUONG');
  const [gasType, setGasType] = useState<'R32' | 'R410A' | 'R22'>('R32');
  const [indoorUnitLocation, setIndoorUnitLocation] = useState('Phòng khách');
  const [outdoorUnitLocation, setOutdoorUnitLocation] = useState('Ban công');

  const filteredDevices = tenantDevices.filter((d) => {
    if (filterBrand !== 'ALL' && d.brand !== filterBrand) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cust = tenantCustomers.find((c) => c.id === d.customerId);
    return (
      d.modelCode.toLowerCase().includes(q) ||
      d.neutralQrCode.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      (cust && cust.fullName.toLowerCase().includes(q))
    );
  });

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!modelCode.trim() || !customerId || !propertyId) {
      setFormError('Vui lòng điền mã Model, chọn Khách hàng và Địa điểm.');
      return;
    }

    // Tenant Isolation Check
    const cust = tenantCustomers.find((c) => c.id === customerId);
    const prop = tenantProperties.find((p) => p.id === propertyId);

    if (!cust || cust.organizationId !== currentOrgId || !prop || prop.organizationId !== currentOrgId) {
      setFormError('Lỗi phân tách tổ chức: Không thể liên kết thiết bị với dữ liệu thuộc tổ chức khác.');
      return;
    }

    const randomNeutralId = `THO-OS-QR-${Math.floor(10000 + Math.random() * 90000)}`;

    const created: Device = {
      id: `dev-${Date.now()}`,
      organizationId: currentOrgId,
      customerId,
      propertyId,
      neutralQrCode: randomNeutralId,
      brand,
      modelCode: modelCode.trim(),
      serialNumber: serialNumber.trim() || undefined,
      horsePower,
      airconType,
      gasType,
      indoorUnitLocation: indoorUnitLocation.trim(),
      outdoorUnitLocation: outdoorUnitLocation.trim() || undefined,
      installedYear: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
    };

    onAddDevice(created);
    setIsModalOpen(false);
    setModelCode('');
    setSerialNumber('');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Hồ sơ Thiết bị Máy lạnh & Neutral QR (DEC-01 & DEC-02)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu máy lạnh thuộc quyền sở hữu riêng của tổ chức, gắn mã QR định danh trung tính (không chứa PII)
          </p>
        </div>

        <Button variant="teal" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Thêm máy lạnh mới
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Model, Mã Neutral QR (VD: THO-OS-QR...), Hãng hoặc Khách hàng..."
            className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>

        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="h-11 px-3 text-xs bg-white rounded-2xl border border-slate-200 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
        >
          <option value="ALL">Tất cả thương hiệu</option>
          <option value="Daikin">Daikin</option>
          <option value="Panasonic">Panasonic</option>
          <option value="LG">LG</option>
          <option value="Mitsubishi Heavy">Mitsubishi</option>
          <option value="Casper">Casper</option>
          <option value="Toshiba">Toshiba</option>
        </select>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredDevices.map((dev) => {
          const owner = customers.find((c) => c.id === dev.customerId);
          const prop = properties.find((p) => p.id === dev.propertyId);

          return (
            <div
              key={dev.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{dev.brand}</span>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {dev.horsePower}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Gas {dev.gasType}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-700 mt-1 font-semibold">
                    Model: {dev.modelCode}
                  </div>
                </div>

                {/* Neutral QR Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDeviceQr(dev)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-600" />
                  <span>Neutral QR</span>
                </button>
              </div>

              {/* Location details */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng:</span>
                  <strong className="text-slate-900">{owner?.fullName} ({owner?.phone})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Địa điểm:</span>
                  <span className="text-slate-800 font-medium">{prop?.label || 'Chưa liên kết'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vị trí dàn lạnh:</span>
                  <span className="text-slate-800">{dev.indoorUnitLocation}</span>
                </div>
                {dev.outdoorUnitLocation && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vị trí dàn nóng:</span>
                    <span className="text-slate-800">{dev.outdoorUnitLocation}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Mã định danh: <strong className="font-mono text-slate-600">{dev.neutralQrCode}</strong></span>
                <span>Bảo dưỡng gần nhất: {dev.lastServicedAt || 'Chưa có'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Neutral QR Modal */}
      {selectedDeviceQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scaleUp text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <QrCode className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                Mã QR Dán Trên Máy Lạnh
              </span>
              <h3 className="font-black text-lg text-slate-900 mt-1">
                {selectedDeviceQr.brand} {selectedDeviceQr.horsePower}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Model: {selectedDeviceQr.modelCode}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              {/* QR Image representation */}
              <div className="w-44 h-44 bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-xs">
                <QrCode className="w-32 h-32 text-slate-900" />
                <span className="font-mono text-xs font-black text-slate-900 mt-1 tracking-wider">
                  {selectedDeviceQr.neutralQrCode}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-left text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Tuân thủ Quyết định DEC-01 & DEC-02
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Mã QR này là mã trung tính công khai, <strong>tuyệt đối không chứa PII (tên, SĐT, địa chỉ nhà)</strong>. Khi khách quét mã sẽ nhận được liên kết riêng tư (hết hạn 7 ngày) kèm mã OTP bảo mật để xem lịch sử bảo dưỡng.
              </p>
            </div>

            <Button variant="teal" size="md" fullWidth onClick={() => setSelectedDeviceQr(null)}>
              Đóng cửa sổ
            </Button>
          </div>
        </div>
      )}

      {/* Modal Add Device */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
            <div className="bg-[#0a1e3f] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Thiết Bị Máy Lạnh Vào Tổ Chức</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="p-5 space-y-3">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khách hàng sở hữu *</label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    const matchedProp = tenantProperties.find((p) => p.customerId === e.target.value);
                    if (matchedProp) setPropertyId(matchedProp.id);
                  }}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                >
                  {tenantCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa điểm lắp đặt *</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                >
                  {availableProperties.length === 0 ? (
                    <option value="">Khách chưa có địa điểm, vui lòng tạo địa điểm trước</option>
                  ) : (
                    availableProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} - {p.address}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hãng máy *</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="Daikin">Daikin</option>
                    <option value="Panasonic">Panasonic</option>
                    <option value="LG">LG</option>
                    <option value="Mitsubishi Heavy">Mitsubishi</option>
                    <option value="Casper">Casper</option>
                    <option value="Toshiba">Toshiba</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Công suất *</label>
                  <select
                    value={horsePower}
                    onChange={(e) => setHorsePower(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="1.0 HP">1.0 HP (Phòng &lt; 15m²)</option>
                    <option value="1.5 HP">1.5 HP (Phòng 15 - 20m²)</option>
                    <option value="2.0 HP">2.0 HP (Phòng 20 - 30m²)</option>
                    <option value="2.5 HP">2.5 HP (Phòng 30 - 40m²)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Model máy lạnh *</label>
                  <input
                    type="text"
                    required
                    value={modelCode}
                    onChange={(e) => setModelCode(e.target.value)}
                    placeholder="VD: FTKF25XVMV"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại Gas *</label>
                  <select
                    value={gasType}
                    onChange={(e) => setGasType(e.target.value as any)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="R32">R32 (Tiêu chuẩn mới)</option>
                    <option value="R410A">R410A (Inverter)</option>
                    <option value="R22">R22 (Đời cũ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vị trí dàn lạnh *</label>
                  <input
                    type="text"
                    required
                    value={indoorUnitLocation}
                    onChange={(e) => setIndoorUnitLocation(e.target.value)}
                    placeholder="VD: Phòng khách, P.ngủ..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vị trí dàn nóng</label>
                  <input
                    type="text"
                    value={outdoorUnitLocation}
                    onChange={(e) => setOutdoorUnitLocation(e.target.value)}
                    placeholder="VD: Ban công, Mái tôn..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="teal" size="md" type="submit" disabled={availableProperties.length === 0}>
                  Lưu Máy Lạnh & Sinh Mã QR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
