import React, { useState } from 'react';
import {
  Snowflake,
  Wrench,
  Gauge,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Calendar,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Sparkles,
  CreditCard,
  Check,
  ArrowLeft,
  Navigation,
} from 'lucide-react';
import { AirconType, ServiceType, Job, BookingRequest } from '../../lib/types';
import { calculateBaseServiceCost, formatVND } from '../../lib/pricing';
import {
  validateBookingStep1,
  validateBookingStep2,
  validateBookingStep3,
} from '../../lib/booking-validation';
import { createBookingRequest } from '../../lib/booking-requests';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface BookingWizardProps {
  onBookingCreated?: (newRequest: BookingRequest) => void;
  onJobCreated?: (newJob: Job) => void;
  currentOrgId?: string;
  onCancel?: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  onBookingCreated,
  onJobCreated,
  currentOrgId = 'org-dienlanh-saigon',
  onCancel,
}) => {
  // 4 Core Steps as requested:
  // 1: Chọn dịch vụ & thiết bị
  // 2: Chọn ngày & khung giờ
  // 3: Cung cấp địa chỉ & thông tin liên hệ
  // 4: Xác nhận đơn đặt lịch
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step notification message (Hiển thị thông báo sau mỗi bước)
  const [stepNotice, setStepNotice] = useState<string | null>(null);

  // Form State
  const [serviceType, setServiceType] = useState<ServiceType>('VE_SINH');
  const [airconType, setAirconType] = useState<AirconType>('TREO_TUONG');
  const [quantity, setQuantity] = useState<number>(1);
  const [brand, setBrand] = useState<string>('Daikin');
  const [horsePower, setHorsePower] = useState<string>('1.5 HP');
  const [symptoms, setSymptoms] = useState<string[]>(['Kém mát / Không mát']);
  const [urgencyLevel, setUrgencyLevel] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  // Step 2 State
  const [scheduledDate, setScheduledDate] = useState<string>('Hôm nay');
  const [scheduledTime, setScheduledTime] = useState<string>('08:30 - 10:00 (Sáng)');

  // Step 3 State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [district, setDistrict] = useState<string>('Quận Tân Bình, TP.HCM');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Step 4 State
  const [paymentPreference, setPaymentPreference] = useState<'TIEN_MAT' | 'CHUYEN_KHOAN_QR'>('CHUYEN_KHOAN_QR');

  // Completed booking screen state (Independent BookingRequest with status 'requested')
  const [createdBookingRequest, setCreatedBookingRequest] = useState<BookingRequest | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const estimatedCost = calculateBaseServiceCost(serviceType, airconType, quantity);
  const discountAmount = 0;
  const finalTotal = estimatedCost;

  // Helper trigger feedback notice
  const notifyStepSuccess = (msg: string) => {
    setStepNotice(msg);
    setTimeout(() => setStepNotice(null), 3000);
  };

  const toggleSymptom = (sym: string) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.filter((s) => s !== sym));
    } else {
      setSymptoms([...symptoms, sym]);
    }
  };

  const handleNextStep1 = () => {
    const val = validateBookingStep1({ serviceType, airconType, quantity });
    if (!val.isValid) {
      setErrors(val.errors);
      return;
    }
    setErrors({});
    setStep(2);
    notifyStepSuccess('Đã lưu loại dịch vụ! Vui lòng chọn ngày và giờ hẹn phù hợp.');
  };

  const handleNextStep2 = () => {
    const val = validateBookingStep2({ preferredDate: scheduledDate, preferredTimeSlot: scheduledTime });
    if (!val.isValid) {
      setErrors(val.errors);
      return;
    }
    setErrors({});
    setStep(3);
    notifyStepSuccess(`Đã chọn lịch hẹn: ${scheduledTime} (${scheduledDate})`);
  };

  const handleNextStep3 = () => {
    const val = validateBookingStep3({ customerName, customerPhone, address });
    if (!val.isValid) {
      setErrors(val.errors);
      return;
    }
    setErrors({});
    setStep(4);
    notifyStepSuccess('Đã cập nhật thông tin liên hệ! Hãy kiểm tra và xác nhận đơn.');
  };

  const handleUseCurrentLocation = () => {
    setAddress('Căn hộ B-14.02, Botanica Premier, 108 Hồng Hà');
    setDistrict('Quận Tân Bình, TP.HCM');
    notifyStepSuccess('Đã tự động điền vị trí hiện tại của bạn!');
  };

  // P0 Invariant: Creates an independent BookingRequest with status 'requested'
  // Strictly does NOT create a Job, does NOT assign technician, does NOT auto-confirm schedule
  const handleConfirmFinalBooking = () => {
    const newRequest = createBookingRequest({
      organizationId: currentOrgId,
      customerName,
      customerPhone,
      address,
      district,
      airconType,
      brand,
      quantity,
      serviceType,
      symptoms,
      preferredDate: scheduledDate,
      preferredTimeSlot: scheduledTime,
      customerNotes: urgencyLevel === 'URGENT' ? `[CẦN GẤP TRONG 60 PHÚT] ${customerNotes}` : customerNotes,
    });

    setCreatedBookingRequest(newRequest);

    if (onBookingCreated) {
      onBookingCreated(newRequest);
    }
  };

  // SUCCESS CONFIRMATION VIEW (Booking requested, awaiting dispatch confirmation)
  if (createdBookingRequest) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 max-w-xl mx-auto text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>

        <Badge variant="navy" className="mb-2">
          ĐÃ TIẾP NHẬN YÊU CẦU • MÃ #{createdBookingRequest.id}
        </Badge>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
          Yêu Cầu Đặt Lịch Đang Chờ Xử Lý!
        </h3>
        <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
          Yêu cầu của bạn đang ở trạng thái <strong className="text-blue-700">Chờ xác nhận (requested)</strong>. Điều phối viên sẽ kiểm tra lịch thợ phù hợp và liên hệ số điện thoại{' '}
          <strong className="text-[#0d9488]">{createdBookingRequest.customerPhone}</strong> để chốt lịch và cử kỹ thuật viên đến hỗ trợ.
        </p>

        {/* Order Card Preview */}
        <div className="mt-5 bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Khung giờ hẹn mong muốn:</span>
            <span className="font-bold text-slate-900">
              {createdBookingRequest.preferredTimeSlot} ({createdBookingRequest.preferredDate})
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Thiết bị:</span>
            <span className="font-bold text-slate-900">
              {quantity} máy {createdBookingRequest.brand} ({airconType === 'AM_TRAN' ? 'Âm trần' : 'Treo tường'})
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500">Địa chỉ thợ đến:</span>
            <span className="font-bold text-slate-900 line-clamp-1">
              {createdBookingRequest.address}, {createdBookingRequest.district}
            </span>
          </div>
          <div className="flex justify-between pt-1 font-bold text-slate-900 text-sm">
            <span>Chi phí ước tính:</span>
            <span className="text-[#0d9488] font-black">{formatVND(finalTotal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <a
            href="tel:19008888"
            className="flex-1 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Phone className="w-4 h-4 text-[#0d9488]" />
            Hotline Điều Phối 1900 8888
          </a>
          <Button
            variant="teal"
            size="lg"
            className="flex-1"
            onClick={() => {
              if (onCancel) onCancel();
            }}
          >
            Quay lại trang chính
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-7 max-w-2xl mx-auto">
      {/* 4-Step Visual Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
          <span className="text-[#0a1e3f]">BƯỚC {step} / 4</span>
          <span className="text-[#0d9488] font-semibold">
            {step === 1 && '1. Chọn loại dịch vụ'}
            {step === 2 && '2. Chọn ngày & khung giờ'}
            {step === 3 && '3. Địa chỉ & liên hệ'}
            {step === 4 && '4. Xác nhận đơn đặt'}
          </span>
        </div>

        {/* Step Indicator Circles */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {[
            { num: 1, label: 'Dịch vụ' },
            { num: 2, label: 'Ngày giờ' },
            { num: 3, label: 'Địa chỉ' },
            { num: 4, label: 'Xác nhận' },
          ].map((s) => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                    isPassed
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-[#0d9488]'
                      : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 font-semibold ${
                    isCurrent
                      ? 'text-[#0d9488] font-bold'
                      : isPassed
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Notification Banner (Thông báo rõ ràng sau mỗi thao tác) */}
      {stepNotice && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs text-[#0f766e] font-medium animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#0d9488] shrink-0" />
          <span>{stepNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 1: CHỌN LOẠI DỊCH VỤ SỬA CHỮA                     */}
      {/* ======================================================== */}
      {step === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              1. Chọn loại dịch vụ máy lạnh cần làm
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bảng giá tiêu chuẩn công khai, thợ khảo sát kỹ trước khi làm, không phát sinh chi phí vô lý.
            </p>
          </div>

          {/* Dịch vụ chính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                type: 'VE_SINH',
                title: 'Vệ sinh & Bảo trì định kỳ',
                desc: 'Xịt rửa áp lực cao dàn lạnh & dàn nóng, thông ống nước',
                icon: Snowflake,
                price: 'Từ 150.000đ',
              },
              {
                type: 'SUA_CHUA',
                title: 'Sửa chữa máy lạnh',
                desc: 'Khắc phục chảy nước, quạt kêu to, mất nguồn, chập cháy',
                icon: Wrench,
                price: 'Từ 180.000đ',
              },
              {
                type: 'NAP_GAS',
                title: 'Bổ sung Gas R32 / R410A / R22',
                desc: 'Đo đồng hồ áp suất, châm thêm gas chuẩn từ 120-150 PSI',
                icon: Gauge,
                price: 'Từ 200.000đ',
              },
              {
                type: 'THAO_LAP',
                title: 'Lắp đặt mới & Di dời máy',
                desc: 'Khoan bắt giá đỡ, hút chân không, lắp dàn nóng lạnh chuẩn',
                icon: PlusCircle,
                price: 'Từ 300.000đ',
              },
            ].map((srv) => {
              const isSelected = serviceType === srv.type;
              const Icon = srv.icon;
              return (
                <div
                  key={srv.type}
                  onClick={() => setServiceType(srv.type as ServiceType)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#0d9488] bg-teal-50/50 ring-2 ring-[#0d9488]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0d9488] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-sm">{srv.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {srv.desc}
                      </div>
                      <div className="text-xs font-bold text-[#0d9488] mt-2">{srv.price}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thiết bị & Số lượng máy */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">Kiểu dáng máy lạnh:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'TREO_TUONG', label: 'Treo tường (Dân dụng)' },
                  { key: 'AM_TRAN', label: 'Âm trần Cassette' },
                  { key: 'TU_DUNG', label: 'Tủ đứng' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setAirconType(t.key as AirconType)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all ${
                      airconType === t.key
                        ? 'bg-[#0a1e3f] text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Số lượng máy:</span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {quantity > 1 ? 'Giảm ngay 25.000đ từ máy thứ 2!' : 'Đặt từ 2 máy để nhận ưu đãi'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-800 font-black flex items-center justify-center hover:bg-slate-100 touch-target"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-black text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-800 font-black flex items-center justify-center hover:bg-slate-100 touch-target"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Triệu chứng lỗi (nếu có) */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Dấu hiệu thực tế của máy (chọn để thợ chuẩn bị linh kiện trước):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Kém mát / Không mát',
                'Chảy nước ướt tường',
                'Quạt lồng sóc kêu rè rè',
                'Mùi ẩm mốc khó chịu',
                'Cục nóng ngoài ban công rung mạnh',
                'Ống đồng bám tuyết trắng',
              ].map((sym) => {
                const active = symptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1 Footer */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <div>
              <div className="text-[11px] text-slate-400">Tạm tính dịch vụ:</div>
              <div className="text-lg font-black text-[#0d9488]">{formatVND(finalTotal)}</div>
            </div>
            <Button variant="teal" size="lg" onClick={handleNextStep1}>
              Tiếp tục: Chọn Ngày Giờ <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 2: CHỌN NGÀY VÀ KHUNG GIỜ MONG MUỐN               */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              2. Chọn ngày & khung giờ thợ đến
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Thợ chính ThợOS cam kết có mặt đúng giờ hoặc sớm hơn 10 phút để chuẩn bị thang và bạt che.
            </p>
          </div>

          {/* Chọn ngày */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Ngày mong muốn:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Hôm nay', sub: 'Có thợ trực' },
                { label: 'Ngày mai', sub: 'Thảnh thơi' },
                { label: 'Cuối tuần này', sub: 'Thứ 7 / CN' },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setScheduledDate(d.label)}
                  className={`p-3 rounded-2xl text-center border transition-all ${
                    scheduledDate === d.label
                      ? 'border-[#0d9488] bg-teal-50/70 text-[#0f766e] ring-2 ring-[#0d9488]/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{d.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chọn khung giờ */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Khung giờ hẹn:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { slot: '08:30 - 10:00 (Sáng)', badge: 'Thợ sẵn sàng' },
                { slot: '10:30 - 12:00 (Trưa)', badge: 'Thuận tiện' },
                { slot: '13:30 - 15:00 (Chiều)', badge: 'Giờ vàng' },
                { slot: '15:30 - 17:00 (Chiều muộn)', badge: 'Thợ sẵn sàng' },
                { slot: '17:30 - 19:30 (Sau giờ làm)', badge: 'Phù hợp đi làm về' },
              ].map((timeItem) => {
                const isSelected = scheduledTime === timeItem.slot;
                return (
                  <button
                    key={timeItem.slot}
                    type="button"
                    onClick={() => setScheduledTime(timeItem.slot)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-[#0d9488] bg-[#0d9488] text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeItem.slot}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {timeItem.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mức độ ưu tiên / Cần gấp */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Cần thợ gấp trong 60 phút?</div>
              <div className="text-[11px] text-slate-500">
                Ưu tiên điều phối thợ đang ở gần vị trí của bạn nhất
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUrgencyLevel(urgencyLevel === 'URGENT' ? 'NORMAL' : 'URGENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                urgencyLevel === 'URGENT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {urgencyLevel === 'URGENT' ? 'Đã bật Ưu Tiên Gấp' : 'Bình thường'}
            </button>
          </div>

          {/* Step 2 Footer */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>
            <Button variant="teal" size="lg" onClick={handleNextStep2}>
              Tiếp tục: Địa Chỉ <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 3: CUNG CẤP ĐỊA CHỈ VÀ THÔNG TIN LIÊN HỆ           */}
      {/* ======================================================== */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              3. Địa chỉ nhà & Thông tin liên hệ
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Thợ sẽ kiểm tra định vị và liên hệ trước khi đến nhà bạn.
            </p>
          </div>

          <Input
            label="Họ và tên người nhận"
            placeholder="VD: Anh Minh Trí"
            required
            leftIcon={<User className="w-4 h-4" />}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            error={errors.customerName}
          />

          <Input
            label="Số điện thoại liên hệ"
            placeholder="VD: 0912 345 678"
            required
            type="tel"
            leftIcon={<Phone className="w-4 h-4" />}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            error={errors.customerPhone}
            hint="Dùng để nhận tin nhắn mã ca và số điện thoại của thợ phụ trách"
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Địa chỉ chi tiết (Số nhà, Tên đường, Căn hộ/Tầng) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] font-bold text-[#0d9488] hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                Lấy vị trí hiện tại
              </button>
            </div>
            <Input
              placeholder="VD: Chung cư Sky Center, 5B Phổ Quang, Tầng 8 Phòng 8.12"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quận / Khu vực
              </label>
              <select
                aria-label="Chọn quận khu vực"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              >
                <option value="Quận 1, TP.HCM">Quận 1, TP.HCM</option>
                <option value="Quận 3, TP.HCM">Quận 3, TP.HCM</option>
                <option value="Quận Tân Bình, TP.HCM">Quận Tân Bình, TP.HCM</option>
                <option value="Quận Phú Nhuận, TP.HCM">Quận Phú Nhuận, TP.HCM</option>
                <option value="Quận Bình Thạnh, TP.HCM">Quận Bình Thạnh, TP.HCM</option>
                <option value="TP. Thủ Đức, TP.HCM">TP. Thủ Đức, TP.HCM</option>
                <option value="Quận Gò Vấp, TP.HCM">Quận Gò Vấp, TP.HCM</option>
                <option value="Quận 7, TP.HCM">Quận 7, TP.HCM</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Hãng máy lạnh
              </label>
              <select
                aria-label="Chọn thương hiệu máy lạnh"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              >
                <option value="Daikin">Daikin</option>
                <option value="Panasonic">Panasonic</option>
                <option value="LG">LG</option>
                <option value="Toshiba">Toshiba</option>
                <option value="Casper">Casper</option>
                <option value="Mitsubishi">Mitsubishi</option>
                <option value="Gree">Gree</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ghi chú thêm cho thợ (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="VD: Cục nóng ở ngoài ban công cần thang cao, nhà trong hẻm nhỏ xe máy..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
            />
          </div>

          {/* Step 3 Footer */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <Button variant="ghost" size="md" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>
            <Button variant="teal" size="lg" onClick={handleNextStep3}>
              Tiếp tục: Xác Nhận <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 4: XÁC NHẬN ĐƠN ĐẶT LỊCH (REVIEW & CONFIRM)        */}
      {/* ======================================================== */}
      {step === 4 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              4. Xác nhận đơn đặt lịch sửa chữa
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Vui lòng kiểm tra lại thông tin trước khi hoàn tất đặt thợ.
            </p>
          </div>

          {/* Review Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dịch vụ đã chọn:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {serviceType === 'VE_SINH' && 'Vệ sinh & Bảo trì máy lạnh'}
                  {serviceType === 'SUA_CHUA' && 'Sửa chữa máy lạnh'}
                  {serviceType === 'NAP_GAS' && 'Bổ sung Gas Inverter'}
                  {serviceType === 'THAO_LAP' && 'Tháo lắp di dời máy'}
                </div>
                <div className="text-slate-600">
                  {quantity} máy {brand} ({airconType === 'AM_TRAN' ? 'Âm trần' : 'Treo tường'})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[#0d9488] font-bold hover:underline"
              >
                Sửa
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lịch hẹn thợ đến:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {scheduledTime} ({scheduledDate})
                </div>
                {urgencyLevel === 'URGENT' && (
                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                    Yêu cầu thợ tới gấp trong 60 phút
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[#0d9488] font-bold hover:underline"
              >
                Sửa
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Thông tin liên hệ & Địa chỉ:</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {customerName} • {customerPhone}
                </div>
                <div className="text-slate-600 line-clamp-1">
                  {address}, {district}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-[#0d9488] font-bold hover:underline"
              >
                Sửa
              </button>
            </div>

            {/* Chi tiết chi phí */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Phí dịch vụ cơ sở ({quantity} máy):</span>
                <span className="font-semibold text-slate-900">{formatVND(estimatedCost)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Ưu đãi máy thứ 2+:</span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Tổng chi phí dự kiến:</span>
                <span className="text-base text-[#0d9488] font-black">{formatVND(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán ưu tiên */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Hình thức thanh toán (chỉ thanh toán sau khi nghiệm thu độ lạnh):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentPreference('CHUYEN_KHOAN_QR')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                  paymentPreference === 'CHUYEN_KHOAN_QR'
                    ? 'border-[#0d9488] bg-teal-50 text-[#0d9488]'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Chuyển khoản VietQR
              </button>
              <button
                type="button"
                onClick={() => setPaymentPreference('TIEN_MAT')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                  paymentPreference === 'TIEN_MAT'
                    ? 'border-[#0d9488] bg-teal-50 text-[#0d9488]'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Tiền mặt cho thợ
              </button>
            </div>
          </div>

          {/* Quy chuẩn chất lượng & cam kết */}
          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Quy chuẩn dịch vụ ThợOS:</div>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Kỹ thuật viên chuyên nghiệp, báo giá minh bạch theo từng phiên bản (QUO-001) và chỉ nhận thanh toán khi bạn đã kiểm tra và nghiệm thu độ lạnh. Thời hạn bảo hành được ghi nhận cụ thể theo từng hạng mục dịch vụ và linh kiện.
              </p>
            </div>
          </div>

          {/* Step 4 Footer */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <Button variant="ghost" size="md" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>
            <Button
              variant="teal"
              size="lg"
              className="px-6 font-bold"
              onClick={handleConfirmFinalBooking}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Xác Nhận Đặt Lịch ({formatVND(finalTotal)})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
