// ============================================================================
// THỢOS CORE DOMAIN TYPES (Aligned with Baseline v2.0 & Sprint 1 Scope)
// ============================================================================

// --- 1. Staff RBAC Roles (Baseline v2.0) ---
// Note: Dispatcher is an operational responsibility / capability assigned to Owner/Manager, not a separate role.
export type StaffRole = 'owner' | 'manager' | 'technician';

export interface StaffUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: StaffRole;
  organizationId: string;
  avatarUrl?: string;
  active: boolean;
  assignedDistricts?: string[];
}

// --- 2. Organization / Tenant (Multi-tenancy DEC-01, DEC-02, DEC-05) ---
export type SubscriptionTier = 'trial' | 'standard' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'read_only' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  shortCode: string;
  phone: string;
  address: string;
  city: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  memberCount: number;
}

// --- 3. Customer & Properties Directory (Sprint 1) ---
export interface Property {
  id: string;
  customerId: string;
  organizationId: string;
  label: string; // e.g. "Căn hộ Masteri T2-1402", "Nhà riêng", "Văn phòng"
  address: string;
  ward?: string;
  district: string;
  city: string;
  accessNotes?: string; // Ghi chú thang máy, vị trí gửi xe, bảo vệ
  createdAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  propertiesCount?: number;
  devicesCount?: number;
  totalServiceOrders?: number;
}

// --- 4. Devices / Air Conditioners (Sprint 1) ---
export type AirconType = 'TREO_TUONG' | 'AM_TRAN' | 'TU_DUNG' | 'MULTI';

export interface Device {
  id: string;
  organizationId: string;
  customerId: string;
  propertyId: string;
  neutralQrCode: string; // Mã định danh trung tính DEC-01 (không chứa PII)
  brand: string;         // Daikin, Panasonic, LG, Mitsubishi, Casper, Toshiba, Gree
  modelCode: string;
  serialNumber?: string;
  horsePower: string;    // 1.0 HP, 1.5 HP, 2.0 HP, 2.5 HP
  airconType: AirconType;
  gasType: 'R32' | 'R410A' | 'R22';
  indoorUnitLocation: string; // Vị trí lắp dàn lạnh: Phòng khách, Phòng ngủ master...
  outdoorUnitLocation?: string; // Vị trí dàn nóng: Ban công, Mái tôn, Vách ngoài...
  installedYear?: number;
  lastServicedAt?: string;
  createdAt: string;
}

// --- 5. Service & Pricing Types ---
export type ServiceType =
  | 'VE_SINH'
  | 'NAP_GAS'
  | 'SUA_CHUA'
  | 'THAO_LAP'
  | 'KIEM_TRA_TONG';

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
  electricCurrentAmps?: number;
  gasPressurePsi?: number;
  tempColdAirC?: number;
  tempAmbientC?: number;
  drainPipeCleared: boolean;
  filterCleaned: boolean;
  outdoorCoilCleaned: boolean;
  electricalTightened: boolean;
  notes?: string;
}

// --- 6. Booking Request & Job Workflow (DEC-03, DEC-04, QUO-001) ---
// Note: Booking requests submitted by homeowner start at 'requested' and are NOT auto-confirmed or auto-assigned.
export type BookingRequestStatus = 'requested' | 'scheduled' | 'cancelled';

export interface BookingRequest {
  id: string;
  organizationId: string;
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
  customerNotes?: string;
  status: BookingRequestStatus;
  createdAt: string;
}

// Job Workflow statuses for field execution
export type JobStatus =
  | 'MOI'              // Đã tiếp nhận & xếp lịch (chờ kỹ thuật viên bắt đầu)
  | 'DANG_TOI'         // Thợ bấm thủ công "Đang đến" (ETA-001, no GPS tracking)
  | 'DANG_KIEM_TRA'    // Thợ đã đến nơi, đang kiểm tra máy
  | 'BAO_GIA'          // Đang lập / chờ duyệt báo giá theo revision (QUO-001)
  | 'DANG_SUA'         // Đang thực hiện vệ sinh / sửa chữa
  | 'HOAN_THANH'       // Hoàn thành kỹ thuật (tách biệt với thanh toán DEC-03)
  | 'DA_HUY';          // Hủy ca

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export type PaymentTransactionType = 'payment' | 'partial_payment' | 'refund' | 'adjustment';

// Payment Ledger entry (Append-only per DEC-03 / ADR-0004)
export interface PaymentLedgerEntry {
  id: string;
  jobId: string;
  amount: number;
  type?: PaymentTransactionType;
  method: 'TIEN_MAT' | 'CHUYEN_KHOAN_QR';
  transactionRef?: string;
  recordedBy: string; // staff ID or Name
  recordedAt: string;
  notes?: string;
}

// Quotation revision per QUO-001
export interface QuotationRevision {
  revisionNumber: number;
  hash: string;
  items: { description: string; price: number; quantity: number }[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending_homeowner' | 'approved' | 'rejected' | 'waived';
  waiverReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface Job {
  id: string;
  organizationId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  district: string;
  scheduledTime: string;
  scheduledDate: string;
  airconType: AirconType;
  brand: string;
  horsePower: string;
  serviceType: ServiceType;
  symptoms: string[];
  customerNotes?: string;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  assignedTechnicianId?: string;
  technicianName?: string;
  technicianPhone?: string;
  checklist: TechnicalChecklist;
  selectedServices: {
    serviceId: string;
    quantity: number;
    price: number;
  }[];
  spareParts: SparePartItem[];
  quotationRevisions?: QuotationRevision[];
  paymentEntries?: PaymentLedgerEntry[];
  photosBefore: string[];
  photosAfter: string[];
  discount: number;
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
