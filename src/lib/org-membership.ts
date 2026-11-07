import { Organization, StaffRole, StaffUser, UserMembership } from './types';

/**
 * Initial Multi-Tenant Memberships mapping users to organizations.
 * Defines real memberships:
 * - staff-01 (Nguyễn Văn Thành) has memberships in:
 *   - org-dienlanh-saigon (Role: owner)
 *   - org-saigon-tanbinh (Role: owner)
 *   He has NO membership in org-bacnam-service!
 * - staff-02 (Lê Hoàng Minh) has membership in org-dienlanh-saigon (manager).
 * - staff-03 & staff-04 have memberships in org-dienlanh-saigon (technician).
 * - staff-05-bn (Trịnh Quang Vinh) has membership in org-bacnam-service (owner).
 * - staff-06-bn (Vũ Đình Trọng) has membership in org-bacnam-service (technician).
 */
export const INITIAL_MEMBERSHIPS: UserMembership[] = [
  {
    id: 'mem-01',
    userId: 'staff-01',
    organizationId: 'org-dienlanh-saigon',
    role: 'owner',
    active: true,
    joinedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mem-02',
    userId: 'staff-01',
    organizationId: 'org-saigon-tanbinh',
    role: 'owner',
    active: true,
    joinedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'mem-03',
    userId: 'staff-02',
    organizationId: 'org-dienlanh-saigon',
    role: 'manager',
    active: true,
    joinedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'mem-04',
    userId: 'staff-03',
    organizationId: 'org-dienlanh-saigon',
    role: 'technician',
    active: true,
    joinedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'mem-05',
    userId: 'staff-04',
    organizationId: 'org-dienlanh-saigon',
    role: 'technician',
    active: true,
    joinedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'mem-06',
    userId: 'staff-05-bn',
    organizationId: 'org-bacnam-service',
    role: 'owner',
    active: true,
    joinedAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'mem-07',
    userId: 'staff-06-bn',
    organizationId: 'org-bacnam-service',
    role: 'technician',
    active: true,
    joinedAt: '2026-03-10T00:00:00Z',
  },
];

/**
 * Returns all active memberships for a given user.
 */
export const getUserMemberships = (
  userId: string,
  memberships: UserMembership[] = INITIAL_MEMBERSHIPS
): UserMembership[] => {
  if (!userId) return [];
  return memberships.filter((m) => m.userId === userId && m.active);
};

/**
 * Returns organizations where the given user has an active membership.
 */
export const getAccessibleOrganizations = (
  userId: string,
  organizations: Organization[],
  memberships: UserMembership[] = INITIAL_MEMBERSHIPS
): Organization[] => {
  const userOrgIds = new Set(
    getUserMemberships(userId, memberships).map((m) => m.organizationId)
  );
  return organizations.filter((org) => userOrgIds.has(org.id));
};

/**
 * Validates whether a user is allowed to switch to a target organization.
 * Strictly checks for an active membership record.
 */
export const canSwitchToOrganization = (
  userId: string,
  targetOrgId: string,
  memberships: UserMembership[] = INITIAL_MEMBERSHIPS
): { allowed: boolean; membership?: UserMembership; error?: string } => {
  if (!userId || !targetOrgId) {
    return { allowed: false, error: 'Thông tin người dùng hoặc tổ chức không hợp lệ.' };
  }

  const membership = memberships.find(
    (m) => m.userId === userId && m.organizationId === targetOrgId && m.active
  );

  if (!membership) {
    return {
      allowed: false,
      error: 'Từ chối truy cập: Người dùng không có tư cách thành viên (membership) hợp lệ tại tổ chức này.',
    };
  }

  return { allowed: true, membership };
};

export interface SwitchOrganizationParams {
  currentUser: StaffUser;
  targetOrg: Organization;
  memberships?: UserMembership[];
}

export interface SwitchOrganizationResult {
  success: boolean;
  error?: string;
  updatedUser?: StaffUser;
}

/**
 * Performs tenant switching while preserving user identity (P0-01).
 * INVARIANTS:
 * - Does NOT mutate identity (id, fullName, email, phone remain identical).
 * - Does NOT pick an arbitrary employee from the target organization.
 * - Refuses access if no valid membership exists.
 * - Updates tenant context (organizationId, role) based on the target membership.
 */
export const switchOrganizationContext = ({
  currentUser,
  targetOrg,
  memberships = INITIAL_MEMBERSHIPS,
}: SwitchOrganizationParams): SwitchOrganizationResult => {
  const check = canSwitchToOrganization(currentUser.id, targetOrg.id, memberships);

  if (!check.allowed || !check.membership) {
    return {
      success: false,
      error:
        check.error ||
        'Từ chối truy cập: Người dùng không có tư cách thành viên hợp lệ tại tổ chức này.',
    };
  }

  const updatedUser: StaffUser = {
    ...currentUser,
    organizationId: targetOrg.id,
    role: check.membership.role,
    active: check.membership.active,
  };

  return {
    success: true,
    updatedUser,
  };
};
