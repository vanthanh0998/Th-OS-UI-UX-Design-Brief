import { AirconType, ServiceType, SparePartItem } from './types';

// Bảng giá cơ sở tiêu chuẩn ngành điện lạnh
export const SERVICE_CATALOG = [
  {
    id: 'VE_SINH_TREO_TUONG',
    name: 'Vệ sinh máy lạnh treo tường',
    description: 'Xịt rửa dàn nóng, dàn lạnh bằng máy áp lực, thông ống thoát nước thải',
    basePrice: 150000,
    unit: 'bộ',
    estimatedMinutes: 45,
    popular: true,
  },
  {
    id: 'VE_SINH_AM_TRAN',
    name: 'Vệ sinh máy lạnh âm trần / cassette',
    description: 'Tháo mặt nạ, bơm xịt dàn trao đổi nhiệt công suất lớn, vệ sinh máng ngưng',
    basePrice: 350000,
    unit: 'bộ',
    estimatedMinutes: 90,
  },
  {
    id: 'NAP_GAS_R32_R410A',
    name: 'Bổ sung gas Inverter (R32 / R410A)',
    description: 'Châm thêm gas áp suất chuẩn từ 120 - 150 PSI, kiểm tra van ti và đầu rắc-co',
    basePrice: 200000,
    unit: 'lần',
    estimatedMinutes: 30,
    popular: true,
  },
  {
    id: 'NAP_GAS_R22',
    name: 'Bổ sung gas R22 máy thường',
    description: 'Châm thêm gas R22 áp suất chuẩn từ 65 - 75 PSI',
    basePrice: 150000,
    unit: 'lần',
    estimatedMinutes: 25,
  },
  {
    id: 'SUA_CHAY_NUOC',
    name: 'Xử lý triệt để chảy nước dàn lạnh',
    description: 'Thổi thông nghẹt đường ống, cân chỉnh máng hứng nước, bọc bảo ôn chống đọng sương',
    basePrice: 180000,
    unit: 'máy',
    estimatedMinutes: 40,
    popular: true,
  },
  {
    id: 'THAY_TU_QUAT_BLOCK',
    name: 'Thay tụ kích khởi động quạt / Block',
    description: 'Thay linh kiện chính hãng, bảo hành 6 tháng',
    basePrice: 300000,
    unit: 'cái',
    estimatedMinutes: 35,
  },
  {
    id: 'KIEM_TRA_TONG_THE',
    name: 'Kiểm tra toàn diện & đo thông số',
    description: 'Đo ampe kìm, áp gas, nhiệt độ cửa gió (Miễn phí nếu sửa chữa)',
    basePrice: 80000,
    unit: 'lần',
    estimatedMinutes: 20,
  },
];

export const COMMON_SPARE_PARTS: Omit<SparePartItem, 'quantity'>[] = [
  { id: 'PART_TU_35UF', name: 'Tụ đề Block 35uF - 450V', unitPrice: 280000, unit: 'cái', warrantyMonths: 6 },
  { id: 'PART_TU_QUAT', name: 'Tụ quạt dàn lạnh 1.5uF - 2.5uF', unitPrice: 160000, unit: 'cái', warrantyMonths: 6 },
  { id: 'PART_SENSOR', name: 'Cảm biến nhiệt dàn đồng / phòng', unitPrice: 220000, unit: 'bộ', warrantyMonths: 6 },
  { id: 'PART_ONG_THOAT', name: 'Ống thoát nước mềm gân xoắn (3m)', unitPrice: 60000, unit: 'cuộn', warrantyMonths: 12 },
  { id: 'PART_GAS_R32_TRON_GOI', name: 'Nạp mới hoàn toàn gas R32 Inverter (hút chân không)', unitPrice: 450000, unit: 'lần', warrantyMonths: 3 },
  { id: 'PART_XU_LY_XI_DONG', name: 'Hàn ống đồng xì rò & nén thử áp', unitPrice: 350000, unit: 'mối', warrantyMonths: 3 },
];

export function calculateBaseServiceCost(
  serviceType: ServiceType,
  airconType: AirconType,
  quantity: number = 1
): number {
  let unitRate = 150000;
  if (serviceType === 'VE_SINH') {
    unitRate = airconType === 'AM_TRAN' ? 350000 : airconType === 'TU_DUNG' ? 280000 : 150000;
  } else if (serviceType === 'NAP_GAS') {
    unitRate = 200000;
  } else if (serviceType === 'SUA_CHUA') {
    unitRate = 220000;
  } else if (serviceType === 'THAO_LAP') {
    unitRate = 300000;
  } else {
    unitRate = 80000;
  }

  // Khuyến mãi số lượng: từ máy thứ 2 trở đi giảm 10% phí dịch vụ cơ sở
  if (quantity > 1) {
    const firstMachine = unitRate;
    const additionalMachines = (quantity - 1) * unitRate * 0.9;
    return Math.round(firstMachine + additionalMachines);
  }
  return unitRate * quantity;
}

export function calculateJobTotal(
  services: { price: number; quantity: number }[],
  spareParts: SparePartItem[],
  discount: number = 0
): {
  subtotalServices: number;
  subtotalParts: number;
  discountAmount: number;
  totalPayable: number;
  technicianPayout: number; // 70% dịch vụ + 100% linh kiện sau khi trừ vốn linh kiện ước tính
} {
  const subtotalServices = services.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const subtotalParts = spareParts.reduce((sum, item) => sum + item.unitPrice * (item.quantity || 1), 0);
  const discountAmount = Math.max(0, discount);
  const gross = subtotalServices + subtotalParts;
  const totalPayable = Math.max(0, gross - discountAmount);

  // Thợ nhận 75% phí công dịch vụ + 25% hoa hồng trên linh kiện bán thêm
  const technicianPayout = Math.round(subtotalServices * 0.75 + subtotalParts * 0.3);

  return {
    subtotalServices,
    subtotalParts,
    discountAmount,
    totalPayable,
    technicianPayout,
  };
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}
