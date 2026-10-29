import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHabitStreak } from './schema.ts';

describe('Goals & Habits pure calculation logic', () => {
  test('returns 0 streak for empty completions', () => {
    assert.equal(calculateHabitStreak([], '2026-10-16'), 0);
  });

  test('calculates correct streak including today', () => {
    const completions = ['2026-10-14', '2026-10-15', '2026-10-16'];
    assert.equal(calculateHabitStreak(completions, '2026-10-16'), 3);
  });

  test('keeps streak alive if completed yesterday but not yet today', () => {
    const completions = ['2026-10-14', '2026-10-15'];
    assert.equal(calculateHabitStreak(completions, '2026-10-16'), 2);
  });

  test('resets streak if gap exists before yesterday', () => {
    const completions = ['2026-10-13']; // 3 days ago
    assert.equal(calculateHabitStreak(completions, '2026-10-16'), 0);
  });
});
