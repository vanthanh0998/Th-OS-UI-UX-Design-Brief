import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Search,
  Phone,
  ShieldCheck,
  RotateCcw,
  UserCheck,
  Building2,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  History,
  Calendar,
} from 'lucide-react';
import { Button } from '../ui/Button';

// Mock profiles for verified organization teams
interface OrganizationPublicProfile {
  id: string;
  name: string;
  shortCode: string;
  phone: string;
  hotline: string;
  address: string;
  districtsCovered: string[];
  yearEstablished: number;
  publicTechnicians: {
    name: string;
    experienceYears: number;
    specialty: string;
  }[];
  isPreviousServiceTeam?: boolean; // For concept 3: Past service team
  lastServiceDate?: string;
  lastServiceDevice?: string;
}

const MOCK_PUBLIC_ORGS: OrganizationPublicProfile[] = [
  {
    id: 'org-dienlanh-saigon',
    name: 'Điện Lạnh Sài Gòn Xanh',
    shortCode: 'SGX',
    phone: '028 3822 9999',
    hotline: '1900 8888',
    address: '142 Điện Biên Phủ, Phường Đa Kao, Quận 1',
    districtsCovered: ['Quận 1', 'Quận 3', 'Bình Thạnh', 'TP. Thủ Đức', 'Phú Nhuận'],
    yearEstablished: 2018,
    isPreviousServiceTeam: true,
    lastServiceDate: '10/08/2026',
    lastServiceDevice: 'Daikin 1.0 HP Inverter (Phòng khách Masteri)',
    publicTechnicians: [
      { name: 'Trần Văn Hùng', experienceYears: 7, specialty: 'Chuyên Inverter Daikin, Panasonic & Xử lý xì gas' },
      { name: 'Phạm Quốc Bảo', experienceYears: 5, specialty: 'Chuyên tháo lắp & máy lạnh Multi, Cassette âm trần' },
    ],
  },
  {
    id: 'org-bacnam-service',
    name: 'Cơ Điện Lạnh Bắc Nam Pro',
    shortCode: 'BNP',
    phone: '028 3755 8888',
    hotline: '1900 6677',
    address: '88 Cầu Giấy, Quan Hoa & Chi nhánh Quận 7',
    districtsCovered: ['Quận 7', 'Nhà Bè', 'Quận 4', 'Quận 8'],
    yearEstablished: 2020,
    isPreviousServiceTeam: false,
    publicTechnicians: [
      { name: 'Lê Hoàng Minh', experienceYears: 9, specialty: 'Bảo trì hệ thống VRV trung tâm và công nghiệp' },
      { name: 'Nguyễn Văn Đạt', experienceYears: 4, specialty: 'Vệ sinh xịt rửa bảo dưỡng dân dụng nhanh trong 45p' },
    ],
  },
  {
    id: 'org-giadinh-care',
    name: 'Trung Tâm Điện Lạnh Gia Đình Care',
    shortCode: 'GDC',
    phone: '028 3911 2233',
    hotline: '0903 888 999',
    address: '324 Hoàng Văn Thụ, Phường 4, Tân Bình',
    districtsCovered: ['Tân Bình', 'Tân Phú', 'Gò Vấp', 'Quận 10', 'Quận 11'],
    yearEstablished: 2016,
    isPreviousServiceTeam: false,
    publicTechnicians: [
      { name: 'Đỗ Tiến Dũng', experienceYears: 8, specialty: 'Chẩn đoán bo mạch biến tần và thay thế lốc nén' },
    ],
  },
];

export const MarketplaceConceptModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [activeConceptTab, setActiveConceptTab] = useState<'NEARBY' | 'PROFILES' | 'REBOOK'>('REBOOK');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedOrgDetail, setSelectedOrgDetail] = useState<OrganizationPublicProfile | null>(null);

  if (!isOpen) return null;

  const filteredOrgs = MOCK_PUBLIC_ORGS.filter((org) => {
    if (activeConceptTab === 'REBOOK') return org.isPreviousServiceTeam;
    if (selectedDistrict === 'ALL') return true;
    return org.districtsCovered.includes(selectedDistrict);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="bg-[#0a1e3f] p-5 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase bg-amber-400 text-slate-900 px-2 py-0.5 rounded-md">
                FUTURE CONCEPT — NOT MVP
              </span>
            </div>
            <h3 className="font-black text-lg text-white mt-1">
              Marketplace Concept: Đội Thợ Chịu Trách Nhiệm Dịch Vụ
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Định hướng PO: Khách hàng tìm đội thợ theo khu vực và có thể yêu cầu lại người thợ quen
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Warning Banner per PO Directive */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-[11px] text-amber-900 flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Lưu ý quan trọng:</strong> Đây là bản mô phỏng ý tưởng định hướng (Concept Wireframe). Hệ thống <strong>không chạy backend marketplace, không GPS realtime, không đánh giá giả, không thu hoa hồng và không thanh toán online</strong>.
          </span>
        </div>

        {/* 3 Main Concept Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveConceptTab('REBOOK');
              setSelectedOrgDetail(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeConceptTab === 'REBOOK'
                ? 'border-[#0d9488] text-[#0a1e3f] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-teal-600" />
            <span>3. Đặt lại thợ quen</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveConceptTab('NEARBY');
              setSelectedOrgDetail(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeConceptTab === 'NEARBY'
                ? 'border-[#0d9488] text-[#0a1e3f] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>1. Tìm đội gần nhà</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveConceptTab('PROFILES');
              setSelectedOrgDetail(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeConceptTab === 'PROFILES'
                ? 'border-[#0d9488] text-[#0a1e3f] bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-teal-600" />
            <span>2. Hồ sơ đội & Thợ</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* CONCEPT 1: Tìm đội thợ gần nhà theo khu vực phục vụ */}
          {activeConceptTab === 'NEARBY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Khu vực đội thợ nhận phục vụ (Service Area Matching)
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Lọc theo địa bàn cam kết của từng cửa hàng/đội thợ (không dùng GPS vệ tinh nền)
                  </p>
                </div>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white"
                >
                  <option value="ALL">Tất cả quận huyện</option>
                  <option value="Quận 1">Quận 1</option>
                  <option value="Quận 3">Quận 3</option>
                  <option value="Quận 7">Quận 7</option>
                  <option value="Bình Thạnh">Bình Thạnh</option>
                  <option value="Tân Bình">Tân Bình</option>
                  <option value="TP. Thủ Đức">TP. Thủ Đức</option>
                </select>
              </div>

              <div className="space-y-2.5">
                {filteredOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-teal-500 bg-white shadow-xs transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{org.name}</span>
                          <span className="text-[10px] font-mono bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded border border-teal-200">
                            {org.shortCode}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{org.address}</div>
                      </div>

                      <a
                        href={`tel:${org.hotline.replace(/\s+/g, '')}`}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0d9488] font-bold text-[11px] flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Hotline {org.hotline}
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-bold">Khu vực phục vụ:</span>
                      {org.districtsCovered.map((d) => (
                        <span
                          key={d}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                            selectedDistrict === d
                              ? 'bg-teal-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONCEPT 2: Xem hồ sơ đội thợ và nhân sự được phép công khai */}
          {activeConceptTab === 'PROFILES' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Hồ Sơ Năng Lực Đội Thợ & Thợ Kỹ Thuật Được Công Khai
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Đội thợ là đơn vị pháp nhân chịu trách nhiệm bảo hành; nhân sự trực tiếp có lý lịch kỹ thuật rõ ràng
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_PUBLIC_ORGS.map((org) => (
                  <div
                    key={org.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h5 className="font-black text-sm text-[#0a1e3f]">{org.name}</h5>
                        <div className="text-[11px] text-slate-500">Hoạt động từ năm {org.yearEstablished}</div>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-teal-600" />
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-700 mb-1.5">
                        Thợ kỹ thuật đại diện ({org.publicTechnicians.length}):
                      </div>
                      <div className="space-y-2">
                        {org.publicTechnicians.map((tech) => (
                          <div key={tech.name} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                            <div className="flex justify-between items-center">
                              <strong className="text-slate-900">{tech.name}</strong>
                              <span className="text-teal-700 font-semibold">{tech.experienceYears} năm kinh nghiệm</span>
                            </div>
                            <p className="text-slate-500 mt-0.5">{tech.specialty}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONCEPT 3: Liên hệ lại đội thợ hoặc người thợ đã phục vụ trước đó */}
          {activeConceptTab === 'REBOOK' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200 flex items-start gap-2.5">
                <History className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-teal-900 text-xs">
                    Tính năng: Yêu Cầu Lại Đội Thợ & Người Thợ Quen
                  </div>
                  <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                    Khách hàng lưu thông tin đội ngũ đã phục vụ tốt máy lạnh của gia đình. Khi cần bảo trì định kỳ, khách có thể liên hệ trực tiếp đội thợ cũ và ghi chú đích danh kỹ thuật viên quen thuộc.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {MOCK_PUBLIC_ORGS.filter((o) => o.isPreviousServiceTeam).map((org) => (
                  <div
                    key={org.id}
                    className="p-4 rounded-2xl border-2 border-teal-500/40 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase">
                          Đã từng phục vụ máy nhà bạn
                        </span>
                        <h5 className="font-black text-base text-slate-900 mt-1">{org.name}</h5>
                        <p className="text-slate-500 text-[11px]">{org.address}</p>
                      </div>

                      <a
                        href={`tel:${org.hotline.replace(/\s+/g, '')}`}
                        className="px-3.5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Gọi Đặt Lại: {org.hotline}
                      </a>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Lần sửa chữa gần nhất:</span>
                        <strong className="text-slate-800">{org.lastServiceDate}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Thiết bị đã làm:</span>
                        <strong className="text-slate-800">{org.lastServiceDevice}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Thợ kỹ thuật đã làm:</span>
                        <strong className="text-[#0d9488]">Trần Văn Hùng (Thợ chính)</strong>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Trách nhiệm bảo hành thuộc về: <strong>{org.name}</strong></span>
                      <span className="text-teal-700 font-bold hover:underline cursor-pointer">
                        Xem lịch sử biên bản cũ &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Marketplace Concept v1.0 • Khảo sát nhu cầu khách hàng & Đội thợ
          </div>
          <Button variant="teal" size="md" onClick={onClose}>
            Đóng Concept
          </Button>
        </div>
      </div>
    </div>
  );
};
