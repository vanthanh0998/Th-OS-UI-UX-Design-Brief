import { Customer, Device, Property } from './types';

/**
 * Filters a list of entities strictly by organizationId (tenant isolation).
 * Prevents cross-tenant data leakage.
 */
export const filterByTenant = <T extends { organizationId: string }>(
  items: T[],
  tenantId: string
): T[] => {
  if (!items || !tenantId) return [];
  return items.filter((item) => item.organizationId === tenantId);
};

/**
 * Validates that a Property and Customer belong to the same organization.
 * Blocks cross-tenant entity linking.
 */
export const validateCrossTenantLink = (
  property: Property,
  customer: Customer
): { valid: boolean; error?: string } => {
  if (!property || !customer) {
    return { valid: false, error: 'Dữ liệu đối tượng không hợp lệ.' };
  }
  if (property.organizationId !== customer.organizationId) {
    return {
      valid: false,
      error: 'Không thể gán địa điểm cho khách hàng thuộc tổ chức khác (Tenant mismatch).',
    };
  }
  return { valid: true };
};

/**
 * Validates that a Device, Customer, and Property all belong to the same organization.
 */
export const validateDeviceTenantLink = (
  deviceOrgId: string,
  customerOrgId: string,
  propertyOrgId: string
): { valid: boolean; error?: string } => {
  if (!deviceOrgId || !customerOrgId || !propertyOrgId) {
    return { valid: false, error: 'Mã tổ chức không được để trống.' };
  }
  if (deviceOrgId !== customerOrgId || deviceOrgId !== propertyOrgId) {
    return {
      valid: false,
      error: 'Dữ liệu thiết bị, khách hàng và địa điểm phải thuộc cùng một tổ chức.',
    };
  }
  return { valid: true };
};
