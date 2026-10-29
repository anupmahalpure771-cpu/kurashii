import test from 'node:test';
import assert from 'node:assert/strict';
import { toMinorUnits, fromMinorUnits, formatMoney } from './money.ts';

test('toMinorUnits converts integer and decimal currency amounts to minor units correctly', () => {
  assert.equal(toMinorUnits(10), 1000);
  assert.equal(toMinorUnits(99.50), 9950);
  assert.equal(toMinorUnits(0.05), 5);
});

test('fromMinorUnits converts minor units back to standard currency float', () => {
  assert.equal(fromMinorUnits(1000), 10);
  assert.equal(fromMinorUnits(9950), 99.5);
  assert.equal(fromMinorUnits(5), 0.05);
});

test('formatMoney produces valid currency string format for INR and USD', () => {
  const inr = formatMoney(500000, 'INR');
  assert.ok(inr.includes('5,000') || inr.includes('₹'));
  const usd = formatMoney(2500, 'USD');
  assert.ok(usd.includes('25'));
});
