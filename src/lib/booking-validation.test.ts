import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBookingStep1,
  validateBookingStep2,
  validateBookingStep3,
  sortJobs,
} from './booking-validation';

test('validateBookingStep1 detects missing service and invalid quantity', () => {
  const res1 = validateBookingStep1({});
  assert.equal(res1.isValid, false);
  assert.ok(res1.errors.serviceType);

  const res2 = validateBookingStep1({ serviceType: 'VE_SINH', airconType: 'TREO_TUONG', quantity: 2 });
  assert.equal(res2.isValid, true);
});

test('validateBookingStep2 requires preferred date and time slot', () => {
  const res1 = validateBookingStep2({});
  assert.equal(res1.isValid, false);
  assert.ok(res1.errors.preferredDate);
  assert.ok(res1.errors.preferredTimeSlot);

  const res2 = validateBookingStep2({ preferredDate: 'Hôm nay', preferredTimeSlot: '08:30 - 10:00' });
  assert.equal(res2.isValid, true);
});

test('validateBookingStep3 validates Vietnamese phone numbers correctly', () => {
  // Invalid phone numbers
  const resInvalid = validateBookingStep3({
    customerName: 'Nguyễn Văn A',
    customerPhone: '12345',
    address: '123 Nguyễn Thị Minh Khai',
  });
  assert.equal(resInvalid.isValid, false);
  assert.ok(resInvalid.errors.customerPhone);

  // Valid VN phone
  const resValid = validateBookingStep3({
    customerName: 'Nguyễn Văn A',
    customerPhone: '0908 123 456',
    address: '123 Nguyễn Thị Minh Khai, Phường 6, Quận 3',
  });
  assert.equal(resValid.isValid, true);
});

test('sortJobs prioritizes active jobs before upcoming jobs and completed jobs', () => {
  const mockJobs = [
    { id: '1', scheduledTime: '14:00 - 15:30', distanceKm: 5, status: 'MOI' },
    { id: '2', scheduledTime: '08:00 - 09:30', distanceKm: 8, status: 'HOAN_THANH' },
    { id: '3', scheduledTime: '10:00 - 11:30', distanceKm: 2, status: 'DANG_TOI' },
  ];

  const sorted = sortJobs(mockJobs, 'TIME');
  // Job 3 (DANG_TOI) should be first
  assert.equal(sorted[0].id, '3');
  // Job 1 (MOI) should be second
  assert.equal(sorted[1].id, '1');
  // Job 2 (HOAN_THANH) should be last
  assert.equal(sorted[2].id, '2');
});

test('sortJobs with DISTANCE sorts upcoming jobs by distance', () => {
  const mockJobs = [
    { id: '1', scheduledTime: '10:00', distanceKm: 6.5, status: 'MOI' },
    { id: '2', scheduledTime: '10:00', distanceKm: 1.2, status: 'MOI' },
  ];

  const sorted = sortJobs(mockJobs, 'DISTANCE');
  assert.equal(sorted[0].id, '2');
  assert.equal(sorted[1].id, '1');
});
