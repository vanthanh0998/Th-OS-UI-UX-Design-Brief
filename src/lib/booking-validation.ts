export interface BookingFormValues {
  serviceType: string;
  airconType: string;
  quantity: number;
  brand: string;
  horsePower: string;
  symptoms: string[];
  preferredDate: string;
  preferredTimeSlot: string;
  customerName: string;
  customerPhone: string;
  address: string;
  district: string;
  customerNotes?: string;
  urgencyLevel?: 'NORMAL' | 'URGENT';
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateBookingStep1(values: Partial<BookingFormValues>): ValidationResult {
  const errors: Record<string, string> = {};
  if (!values.serviceType) {
    errors.serviceType = 'Vui lòng chọn loại dịch vụ cần sửa chữa hoặc bảo trì';
  }
  if (!values.airconType) {
    errors.airconType = 'Vui lòng chọn kiểu máy lạnh (treo tường, âm trần...)';
  }
  if (!values.quantity || values.quantity < 1) {
    errors.quantity = 'Số lượng máy tối thiểu là 1';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBookingStep2(values: Partial<BookingFormValues>): ValidationResult {
  const errors: Record<string, string> = {};
  if (!values.preferredDate) {
    errors.preferredDate = 'Vui lòng chọn ngày thợ đến';
  }
  if (!values.preferredTimeSlot) {
    errors.preferredTimeSlot = 'Vui lòng chọn khung giờ hẹn mong muốn';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBookingStep3(values: Partial<BookingFormValues>): ValidationResult {
  const errors: Record<string, string> = {};
  const name = (values.customerName || '').trim();
  const phone = (values.customerPhone || '').replace(/\s+/g, '');
  const addr = (values.address || '').trim();

  if (!name) {
    errors.customerName = 'Vui lòng nhập họ và tên của bạn';
  } else if (name.length < 2) {
    errors.customerName = 'Họ tên quá ngắn (tối thiểu 2 ký tự)';
  }

  if (!phone) {
    errors.customerPhone = 'Vui lòng nhập số điện thoại để thợ liên hệ';
  } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone)) {
    errors.customerPhone = 'Số điện thoại không đúng định dạng VN (VD: 0912345678)';
  }

  if (!addr) {
    errors.address = 'Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường, căn hộ)';
  } else if (addr.length < 5) {
    errors.address = 'Địa chỉ cần chi tiết hơn để thợ tìm đường chính xác';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Sắp xếp công việc cho thợ: Theo thời gian hẹn hoặc mức ưu tiên kỹ thuật
export function sortJobs<T extends { scheduledTime: string; status: string; symptoms?: string[] }>(
  jobs: T[],
  sortBy: 'TIME' | 'PRIORITY'
): T[] {
  return [...jobs].sort((a, b) => {
    // Luôn ưu tiên công việc đang diễn ra lên trước
    const activeStatuses = ['DANG_TOI', 'DANG_KIEM_TRA', 'BAO_GIA', 'DANG_SUA'];
    const aIsActive = activeStatuses.includes(a.status);
    const bIsActive = activeStatuses.includes(b.status);
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Các đơn đã xong đưa xuống dưới
    if (a.status === 'HOAN_THANH' && b.status !== 'HOAN_THANH') return 1;
    if (a.status !== 'HOAN_THANH' && b.status === 'HOAN_THANH') return -1;

    if (sortBy === 'PRIORITY') {
      // Ưu tiên ca có triệu chứng chảy nước, không mát hoặc chập điện
      const aIsEmergency = (a.symptoms || []).some(
        (s) => s.toLowerCase().includes('chảy nước') || s.toLowerCase().includes('không mát')
      );
      const bIsEmergency = (b.symptoms || []).some(
        (s) => s.toLowerCase().includes('chảy nước') || s.toLowerCase().includes('không mát')
      );
      if (aIsEmergency && !bIsEmergency) return -1;
      if (!aIsEmergency && bIsEmergency) return 1;
    }

    // Mặc định: theo khung giờ hẹn (chuỗi "08:30 - ...")
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });
}
