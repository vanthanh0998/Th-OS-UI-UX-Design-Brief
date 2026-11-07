import test from 'node:test';
import assert from 'node:assert/strict';
import { filterByTenant, validateCrossTenantLink, validateDeviceTenantLink } from './tenant-isolation';
import { Customer, Property } from './types';

test('filterByTenant strictly separates data between Org A and Org B', () => {
  const customers: Customer[] = [
    {
      id: 'c1',
      organizationId: 'org-dienlanh-saigon',
      fullName: 'Khách Sài Gòn',
      phone: '0901',
      isArchived: false,
      createdAt: '2026-11-06',
      updatedAt: '2026-11-06',
    },
    {
      id: 'c2',
      organizationId: 'org-bacnam-service',
      fullName: 'Khách Hà Nội',
      phone: '0902',
      isArchived: false,
      createdAt: '2026-11-06',
      updatedAt: '2026-11-06',
    },
  ];

  const sgxCustomers = filterByTenant(customers, 'org-dienlanh-saigon');
  assert.equal(sgxCustomers.length, 1);
  assert.equal(sgxCustomers[0].id, 'c1');

  const bnpCustomers = filterByTenant(customers, 'org-bacnam-service');
  assert.equal(bnpCustomers.length, 1);
  assert.equal(bnpCustomers[0].id, 'c2');
});

test('validateCrossTenantLink rejects associating property to a customer from another tenant', () => {
  const property: Property = {
    id: 'prop-01',
    organizationId: 'org-dienlanh-saigon',
    customerId: 'c1',
    label: 'Căn hộ Masteri',
    address: '159 Xa Lộ Hà Nội',
    district: 'Thủ Đức',
    city: 'TP.HCM',
    createdAt: '2026-11-06',
  };

  const validCustomer: Customer = {
    id: 'c1',
    organizationId: 'org-dienlanh-saigon',
    fullName: 'Khách SGX',
    phone: '0901',
    isArchived: false,
    createdAt: '2026-11-06',
    updatedAt: '2026-11-06',
  };

  const crossTenantCustomer: Customer = {
    id: 'c2',
    organizationId: 'org-bacnam-service',
    fullName: 'Khách BNP',
    phone: '0902',
    isArchived: false,
    createdAt: '2026-11-06',
    updatedAt: '2026-11-06',
  };

  assert.equal(validateCrossTenantLink(property, validCustomer).valid, true);

  const crossResult = validateCrossTenantLink(property, crossTenantCustomer);
  assert.equal(crossResult.valid, false);
  assert.match(crossResult.error || '', /Tenant mismatch/);
});

test('validateDeviceTenantLink ensures device, customer, and property share same organizationId', () => {
  assert.equal(
    validateDeviceTenantLink('org-sgx', 'org-sgx', 'org-sgx').valid,
    true
  );

  assert.equal(
    validateDeviceTenantLink('org-sgx', 'org-hn', 'org-sgx').valid,
    false
  );

  assert.equal(
    validateDeviceTenantLink('org-sgx', 'org-sgx', 'org-hn').valid,
    false
  );
});
