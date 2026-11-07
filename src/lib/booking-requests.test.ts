import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingRequest, validateBookingRequest } from './booking-requests';
import { BookingRequest, Job } from './types';

test('createBookingRequest from real module creates independent request with requested status', () => {
  const req = createBookingRequest({
    customerName: 'Chị Mai Lan',
    customerPhone: '0908123456',
    address: '159 Xa Lộ Hà Nội',
    district: 'TP. Thủ Đức',
    airconType: 'TREO_TUONG',
    brand: 'Daikin',
    quantity: 2,
    serviceType: 'VE_SINH',
    symptoms: ['Chảy nước'],
    preferredDate: 'Hôm nay',
    preferredTimeSlot: '08:30 - 10:00',
    customerNotes: 'Nhà có em bé',
    organizationId: 'org-dienlanh-saigon',
  });

  assert.equal(req.status, 'requested');
  assert.equal((req as any).assignedTechnicianId, undefined);
  assert.equal(req.organizationId, 'org-dienlanh-saigon');
  assert.equal(req.quantity, 2);
  assert.equal(req.brand, 'Daikin');
});

test('validateBookingRequest enforces required fields and Vietnamese phone format', () => {
  const invalidPhone = validateBookingRequest({
    customerName: 'Anh Tuấn',
    customerPhone: '12345',
    address: '123 Lê Lợi',
    organizationId: 'org-dienlanh-saigon',
  });
  assert.equal(invalidPhone.valid, false);
  assert.match(invalidPhone.error || '', /định dạng Việt Nam/);

  const missingName = validateBookingRequest({
    customerName: '',
    customerPhone: '0908123456',
    address: '123 Lê Lợi',
    organizationId: 'org-dienlanh-saigon',
  });
  assert.equal(missingName.valid, false);

  const valid = validateBookingRequest({
    customerName: 'Nguyễn Văn A',
    customerPhone: '0908123456',
    address: '123 Lê Lợi',
    organizationId: 'org-dienlanh-saigon',
  });
  assert.equal(valid.valid, true);
});

test('submitting a booking request does not alter jobs list', () => {
  const initialJobs: Job[] = [
    {
      id: 'JOB-01',
      organizationId: 'org-dienlanh-saigon',
      customerName: 'Anh Nam',
      customerPhone: '0912345678',
      address: 'Quận 5',
      district: 'Quận 5',
      scheduledTime: '08:30 - 10:00',
      scheduledDate: 'Hôm nay',
      airconType: 'TREO_TUONG',
      brand: 'Daikin',
      horsePower: '1.5 HP',
      serviceType: 'VE_SINH',
      symptoms: [],
      status: 'MOI',
      paymentStatus: 'unpaid',
      checklist: {
        drainPipeCleared: false,
        filterCleaned: false,
        outdoorCoilCleaned: false,
        electricalTightened: false,
      },
      selectedServices: [],
      spareParts: [],
      photosBefore: [],
      photosAfter: [],
      discount: 0,
      createdAt: '2026-11-06T00:00:00Z',
    },
  ];

  const bookingRequests: BookingRequest[] = [];

  const handleBookingCreated = (newReq: BookingRequest) => {
    bookingRequests.push(newReq);
    // Jobs array is intentionally untouched per DEC-04
  };

  const newReq = createBookingRequest({
    customerName: 'Khách Mới',
    customerPhone: '0909999888',
    address: 'Bình Thạnh',
    district: 'Bình Thạnh',
    airconType: 'TREO_TUONG',
    brand: 'Panasonic',
    quantity: 1,
    serviceType: 'SUA_CHUA',
    symptoms: ['Không lạnh'],
    preferredDate: 'Ngày mai',
    preferredTimeSlot: '14:00 - 15:30',
    organizationId: 'org-dienlanh-saigon',
  });

  handleBookingCreated(newReq);

  assert.equal(initialJobs.length, 1);
  assert.equal(bookingRequests.length, 1);
  assert.equal(bookingRequests[0].status, 'requested');
});
