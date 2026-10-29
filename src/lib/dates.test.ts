import test from 'node:test';
import assert from 'node:assert/strict';
import { isOverdue, isDueToday, isDueThisWeek, formatReadableDate } from './dates.ts';

test('isOverdue correctly flags past due dates', () => {
  assert.equal(isOverdue('2026-10-10', '2026-10-15'), true);
  assert.equal(isOverdue('2026-10-15', '2026-10-15'), false);
  assert.equal(isOverdue('2026-10-20', '2026-10-15'), false);
  assert.equal(isOverdue(null, '2026-10-15'), false);
});

test('isDueToday checks equality with today date', () => {
  assert.equal(isDueToday('2026-10-15', '2026-10-15'), true);
  assert.equal(isDueToday('2026-10-16', '2026-10-15'), false);
});

test('isDueThisWeek identifies dates within 7 days', () => {
  assert.equal(isDueThisWeek('2026-10-17', '2026-10-15'), true);
  assert.equal(isDueThisWeek('2026-10-22', '2026-10-15'), true);
  assert.equal(isDueThisWeek('2026-10-25', '2026-10-15'), false);
  assert.equal(isDueThisWeek('2026-10-10', '2026-10-15'), false);
});

test('formatReadableDate produces formatted date', () => {
  const formatted = formatReadableDate('2026-10-15');
  assert.ok(formatted.includes('15') && formatted.includes('Oct') && formatted.includes('2026'));
});
