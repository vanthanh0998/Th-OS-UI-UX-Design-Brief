import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getUserMemberships,
  getAccessibleOrganizations,
  canSwitchToOrganization,
  switchOrganizationContext,
} from './org-membership';
import { Organization, StaffUser, UserMembership } from './types';

const mockOrganizations: Organization[] = [
  {
    id: 'org-dienlanh-saigon',
    name: 'Điện Lạnh Sài Gòn Xanh',
    shortCode: 'SGX',
    phone: '028 3822 9999',
    address: '142 Điện Biên Phủ',
    city: 'TP.HCM',
    subscriptionTier: 'standard',
    subscriptionStatus: 'active',
    memberCount: 5,
  },
  {
    id: 'org-saigon-tanbinh',
    name: 'Sài Gòn Xanh - Chi nhánh Tân Bình',
    shortCode: 'SGTB',
    phone: '028 3844 7777',
    address: '360 Cộng Hòa',
    city: 'TP.HCM',
    subscriptionTier: 'standard',
    subscriptionStatus: 'active',
    memberCount: 2,
  },
  {
    id: 'org-bacnam-service',
    name: 'Cơ Điện Lạnh Bắc Nam Pro',
    shortCode: 'BNP',
    phone: '024 3755 8888',
    address: '88 Cầu Giấy',
    city: 'Hà Nội',
    subscriptionTier: 'trial',
    subscriptionStatus: 'trial',
    memberCount: 3,
  },
];

const mockMemberships: UserMembership[] = [
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
    userId: 'staff-05-bn',
    organizationId: 'org-bacnam-service',
    role: 'owner',
    active: true,
    joinedAt: '2026-02-15T00:00:00Z',
  },
];

const mockCurrentUser: StaffUser = {
  id: 'staff-01',
  fullName: 'Nguyễn Văn Thành',
  phone: '0903 111 222',
  email: 'thanh.nguyen@dienlanhsgx.vn',
  role: 'owner',
  organizationId: 'org-dienlanh-saigon',
  active: true,
};

test('getUserMemberships and getAccessibleOrganizations return only organizations with active membership', () => {
  const memberships = getUserMemberships('staff-01', mockMemberships);
  assert.equal(memberships.length, 2);

  const accessibleOrgs = getAccessibleOrganizations('staff-01', mockOrganizations, mockMemberships);
  assert.equal(accessibleOrgs.length, 2);
  assert.equal(accessibleOrgs.map((o) => o.id).includes('org-bacnam-service'), false);
});

test('canSwitchToOrganization allows authorized tenant and rejects unauthorized tenant', () => {
  // Allowed: staff-01 has membership in org-saigon-tanbinh
  const checkAllowed = canSwitchToOrganization('staff-01', 'org-saigon-tanbinh', mockMemberships);
  assert.equal(checkAllowed.allowed, true);
  assert.equal(checkAllowed.membership?.role, 'owner');

  // Rejected: staff-01 has NO membership in org-bacnam-service
  const checkDenied = canSwitchToOrganization('staff-01', 'org-bacnam-service', mockMemberships);
  assert.equal(checkDenied.allowed, false);
  assert.match(checkDenied.error || '', /không có tư cách thành viên/);
});

test('switchOrganizationContext preserves user identity and refuses access when membership is missing', () => {
  // 1. Successful switch: identity is strictly preserved
  const targetOrg = mockOrganizations[1]; // org-saigon-tanbinh
  const result = switchOrganizationContext({
    currentUser: mockCurrentUser,
    targetOrg,
    memberships: mockMemberships,
  });

  assert.equal(result.success, true);
  assert.equal(result.updatedUser?.id, mockCurrentUser.id); // Same ID!
  assert.equal(result.updatedUser?.fullName, mockCurrentUser.fullName); // Same Name!
  assert.equal(result.updatedUser?.email, mockCurrentUser.email); // Same Email!
  assert.equal(result.updatedUser?.phone, mockCurrentUser.phone); // Same Phone!
  assert.equal(result.updatedUser?.organizationId, 'org-saigon-tanbinh'); // Updated Tenant!

  // 2. Denied switch: staff-01 tries to access org-bacnam-service
  const unauthorizedOrg = mockOrganizations[2]; // org-bacnam-service
  const deniedResult = switchOrganizationContext({
    currentUser: mockCurrentUser,
    targetOrg: unauthorizedOrg,
    memberships: mockMemberships,
  });

  assert.equal(deniedResult.success, false);
  assert.equal(deniedResult.updatedUser, undefined);
  assert.match(deniedResult.error || '', /Từ chối truy cập/);
});
