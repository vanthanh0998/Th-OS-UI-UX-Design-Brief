import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBaseServiceCost, calculateJobTotal, formatVND } from './pricing';

test('calculateBaseServiceCost calculates single wall aircon cleaning correctly', () => {
  const cost = calculateBaseServiceCost('VE_SINH', 'TREO_TUONG', 1);
  assert.equal(cost, 150000);
});

test('calculateBaseServiceCost calculates cassette / ceiling aircon cleaning correctly', () => {
  const cost = calculateBaseServiceCost('VE_SINH', 'AM_TRAN', 1);
  assert.equal(cost, 350000);
});

test('calculateBaseServiceCost applies 10% discount on additional units for multi-machine bookings', () => {
  // 1st unit: 150k, 2nd unit: 150k * 0.9 = 135k => Total: 285k
  const cost = calculateBaseServiceCost('VE_SINH', 'TREO_TUONG', 2);
  assert.equal(cost, 285000);
});

test('calculateJobTotal calculates subtotal, discount, and technician commission', () => {
  const services = [{ price: 150000, quantity: 2 }]; // 300,000đ
  const spareParts = [
    { id: 'p1', name: 'Tụ đề Block', unitPrice: 280000, unit: 'cái', quantity: 1, warrantyMonths: 6 },
  ]; // 280,000đ
  const discount = 30000;

  const res = calculateJobTotal(services, spareParts, discount);

  assert.equal(res.subtotalServices, 300000);
  assert.equal(res.subtotalParts, 280000);
  assert.equal(res.discountAmount, 30000);
  assert.equal(res.totalPayable, 550000); // 300k + 280k - 30k = 550k

  // Tech payout: 300k * 0.75 (225k) + 280k * 0.3 (84k) = 309,000đ
  assert.equal(res.technicianPayout, 309000);
});

test('formatVND formats Vietnamese currency strings properly', () => {
  const formatted = formatVND(150000);
  assert.match(formatted, /150/);
});
