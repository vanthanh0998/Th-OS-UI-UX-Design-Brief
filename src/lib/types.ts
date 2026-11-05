export type JobStatus =
  | 'MOI'              // Đơn mới, chờ xác nhận / nhận việc
  | 'DANG_TOI'         // Thợ đang di chuyển tới nhà khách
  | 'DANG_KIEM_TRA'    // Thợ đã tới, đang kiểm tra & đo đạc thông số
  | 'BAO_GIA'          // Đang báo giá phát sinh cho khách
  | 'DANG_SUA'         // Khách đồng ý, đang tiến hành vệ sinh / sửa chữa
  | 'HOAN_THANH'       // Đã xong nghiệm thu, đã thanh toán
  | 'DA_HUY';          // Hủy đơn

export type AirconType = 'TREO_TUONG' | 'AM_TRAN' | 'TU_DUNG' | 'MULTI';

export type ServiceType =
  | 'VE_SINH'          // Vệ sinh xịt rửa bảo dưỡng
  | 'NAP_GAS'          // Bổ sung hoặc nạp mới gas
  | 'SUA_CHUA'         // Sửa lỗi máy không mát, chảy nước, mất nguồn
  | 'THAO_LAP'         // Tháo lắp di dời vị trí
  | 'KIEM_TRA_TONG';   // Kiểm tra toàn diện định kỳ

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  estimatedMinutes: number;
  popular?: boolean;
}

export interface SparePartItem {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
  quantity: number;
  warrantyMonths: number;
}

export interface TechnicalChecklist {
  electricCurrentAmps?: number;     // Dòng tải (A) - chuẩn thường 3.5 - 6.5A
  gasPressurePsi?: number;          // Áp suất gas (PSI) - R32/R410A ~ 120-150 PSI
  tempColdAirC?: number;            // Nhiệt độ gió ra dàn lạnh (°C) - chuẩn 10-14°C
  tempAmbientC?: number;            // Nhiệt độ phòng (°C)
  drainPipeCleared: boolean;        // Thông máng & ống thoát nước
  filterCleaned: boolean;           // Lưới lọc bụi rửa sạch
  outdoorCoilCleaned: boolean;      // Dàn nóng thông thoáng
  electricalTightened: boolean;     // Siết ốc tiếp điểm điện, kiểm tra tụ
  notes?: string;
}

export interface Job {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  district: string;
  distanceKm: number;
  scheduledTime: string;           // e.g. "08:30 - 09:30"
  scheduledDate: string;           // "Hôm nay", "Ngày mai" or YYYY-MM-DD
  airconType: AirconType;
  brand: string;                   // Daikin, Panasonic, LG, Mitsubishi, Casper, Toshiba
  horsePower: string;              // 1.0 HP, 1.5 HP, 2.0 HP, 2.5 HP
  serviceType: ServiceType;
  symptoms: string[];              // "Chảy nước dàn lạnh", "Kém mát", "Hơi thổi yếu"
  customerNotes?: string;
  status: JobStatus;
  technicianName: string;
  technicianPhone: string;
  checklist: TechnicalChecklist;
  selectedServices: {
    serviceId: string;
    quantity: number;
    price: number;
  }[];
  spareParts: SparePartItem[];
  photosBefore: string[];
  photosAfter: string[];
  discount: number;
  paymentMethod?: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR' | 'CHUA_THANH_TOAN';
  createdAt: string;
  completedAt?: string;
}

export interface CustomerBookingInput {
  customerName: string;
  customerPhone: string;
  address: string;
  district: string;
  airconType: AirconType;
  brand: string;
  quantity: number;
  serviceType: ServiceType;
  symptoms: string[];
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string;
}
