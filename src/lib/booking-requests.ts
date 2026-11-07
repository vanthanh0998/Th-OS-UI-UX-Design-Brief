import { AirconType, BookingRequest, BookingRequestStatus, ServiceType } from './types';

export interface CreateBookingRequestParams {
  customerName: string;
  customerPhone: string;
  address: string;
  district: string;
  airconType: AirconType;
  brand: string;
  quantity: number;
  serviceType: ServiceType;
  symptoms?: string[];
  preferredDate: string;
  preferredTimeSlot: string;
  customerNotes?: string;
  organizationId: string;
}

/**
 * Creates an independent BookingRequest with status 'requested'.
 * CRITICAL BUSINESS INVARIANT (DEC-04):
 * - Does NOT create a Job (status 'MOI').
 * - Does NOT auto-assign any technician.
 * - Does NOT auto-confirm or lock a schedule.
 * - Stored in a separate bookingRequests collection, leaving the jobs array untouched.
 */
export const createBookingRequest = (
  params: CreateBookingRequestParams
): BookingRequest => {
  return {
    id: `REQ-${Date.now().toString().slice(-4)}`,
    organizationId: params.organizationId,
    customerName: params.customerName.trim(),
    customerPhone: params.customerPhone.trim(),
    address: params.address.trim(),
    district: params.district.trim(),
    airconType: params.airconType,
    brand: params.brand.trim() || 'Daikin',
    quantity: Math.max(1, params.quantity || 1),
    serviceType: params.serviceType,
    symptoms: params.symptoms || [],
    preferredDate: params.preferredDate,
    preferredTimeSlot: params.preferredTimeSlot,
    customerNotes: params.customerNotes?.trim() || undefined,
    status: 'requested',
    createdAt: new Date().toISOString(),
  };
};

/**
 * Validates whether a booking request meets minimal requirements before dispatching.
 */
export const validateBookingRequest = (
  req: Partial<BookingRequest>
): { valid: boolean; error?: string } => {
  if (!req.customerName || !req.customerName.trim()) {
    return { valid: false, error: 'Họ và tên khách hàng là bắt buộc.' };
  }
  if (!req.customerPhone || !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(req.customerPhone.trim())) {
    return { valid: false, error: 'Số điện thoại không đúng định dạng Việt Nam.' };
  }
  if (!req.address || !req.address.trim()) {
    return { valid: false, error: 'Địa chỉ lắp đặt là bắt buộc.' };
  }
  if (!req.organizationId) {
    return { valid: false, error: 'Mã tổ chức không hợp lệ.' };
  }
  return { valid: true };
};
