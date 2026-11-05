import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionTo, getNextStatus, STATUS_MAP } from './status-machine';

test('status machine allows forward progression', () => {
  assert.equal(canTransitionTo('MOI', 'DANG_TOI'), true);
  assert.equal(canTransitionTo('DANG_TOI', 'DANG_KIEM_TRA'), true);
  assert.equal(canTransitionTo('DANG_KIEM_TRA', 'BAO_GIA'), true);
  assert.equal(canTransitionTo('BAO_GIA', 'DANG_SUA'), true);
  assert.equal(canTransitionTo('DANG_SUA', 'HOAN_THANH'), true);
});

test('status machine disallows skipping forward without intermediate steps', () => {
  assert.equal(canTransitionTo('MOI', 'HOAN_THANH'), false);
  assert.equal(canTransitionTo('DANG_TOI', 'DANG_SUA'), false);
});

test('status machine allows cancellation from in-flight states', () => {
  assert.equal(canTransitionTo('MOI', 'DA_HUY'), true);
  assert.equal(canTransitionTo('DANG_TOI', 'DA_HUY'), true);
  assert.equal(canTransitionTo('HOAN_THANH', 'DA_HUY'), false);
});

test('getNextStatus returns valid step sequence', () => {
  assert.equal(getNextStatus('MOI'), 'DANG_TOI');
  assert.equal(getNextStatus('DANG_SUA'), 'HOAN_THANH');
  assert.equal(getNextStatus('HOAN_THANH'), null);
});

test('STATUS_MAP contains correct labels for all statuses', () => {
  assert.equal(STATUS_MAP.MOI.shortLabel, 'Đơn mới');
  assert.equal(STATUS_MAP.HOAN_THANH.shortLabel, 'Đã xong');
});
