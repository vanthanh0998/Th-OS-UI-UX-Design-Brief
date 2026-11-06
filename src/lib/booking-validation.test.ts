import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBookingStep1,
  validateBookingStep2,
  validateBookingStep3,
  sortJobs,
} from './booking-validation';

test('validateBookingStep1 detects missing service and invalid quantity', () => {
  const resEmpty = validateBookingStep1({});
  assert.equal(resEmpty.isValid, false);
  assert.ok(resEmpty.errors.serviceType);
  assert.ok(resEmpty.errors.airconType);
  assert.ok(resEmpty.errors.quantity);

  const resValid = validateBookingStep1({
    serviceType: 'VE_SINH',
    airconType: 'TREO_TUONG',
    quantity: 2,
  });
  assert.equal(resValid.isValid, true);
  assert.equal(Object.keys(resValid.errors).length, 0);
});

test('validateBookingStep2 requires preferred date and time slot', () => {
  const resEmpty = validateBookingStep2({});
  assert.equal(resEmpty.isValid, false);
  assert.ok(resEmpty.errors.preferredDate);
  assert.ok(resEmpty.errors.preferredTimeSlot);

  const resValid = validateBookingStep2({
    preferredDate: 'Hôm nay',
    preferredTimeSlot: '08:00 - 10:00',
  });
  assert.equal(resValid.isValid, true);
});

test('validateBookingStep3 validates Vietnamese phone numbers correctly', () => {
  const resBadPhone = validateBookingStep3({
    customerName: 'Nguyễn Văn A',
    customerPhone: '12345',
    address: '123 Nguyễn Huệ, Phường Bến Nghé',
  });
  assert.equal(resBadPhone.isValid, false);
  assert.ok(resBadPhone.errors.customerPhone);

  const resValid = validateBookingStep3({
    customerName: 'Nguyễn Văn A',
    customerPhone: '0908123456',
    address: '123 Nguyễn Huệ, Phường Bến Nghé',
  });
  assert.equal(resValid.isValid, true);
});

test('sortJobs prioritizes active jobs before upcoming jobs and completed jobs', () => {
  const mockJobs = [
    { scheduledTime: '14:00', status: 'HOAN_THANH' },
    { scheduledTime: '10:00', status: 'MOI' },
    { scheduledTime: '11:00', status: 'DANG_KIEM_TRA' },
  ];

  const sorted = sortJobs(mockJobs, 'TIME');
  assert.equal(sorted[0].status, 'DANG_KIEM_TRA');
  assert.equal(sorted[1].status, 'MOI');
  assert.equal(sorted[2].status, 'HOAN_THANH');
});

test('sortJobs with PRIORITY sorts emergency symptom jobs first', () => {
  const mockJobs = [
    { scheduledTime: '11:00', status: 'MOI', symptoms: ['Bụi bẩn thông thường'] },
    { scheduledTime: '14:00', status: 'MOI', symptoms: ['Chảy nước ngập sàn nhà'] },
  ];

  const sorted = sortJobs(mockJobs, 'PRIORITY');
  assert.equal(sorted[0].symptoms?.[0], 'Chảy nước ngập sàn nhà');
});
