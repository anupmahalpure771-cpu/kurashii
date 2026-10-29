import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertToSeconds,
  convertSecondsToDisplay,
  parseTimeInputToSeconds,
  formatFocusTime,
  formatSessionLabel,
  calculateProgressPercent,
  DEFAULT_FOCUS_MINUTES,
} from './focusUtils.ts';

describe('Focus Timer pure logic & unit toggling', () => {
  test('converts minutes to seconds correctly', () => {
    assert.equal(convertToSeconds(25, 'min'), 1500);
    assert.equal(convertToSeconds(45, 'min'), 2700);
    assert.equal(convertToSeconds(360, 'min'), 21600);
    // Unbounded: handles values greater than 360 minutes
    assert.equal(convertToSeconds(500, 'min'), 30000);
    assert.equal(convertToSeconds(720, 'min'), 43200);
  });

  test('converts hours to seconds correctly', () => {
    assert.equal(convertToSeconds(1, 'hr'), 3600);
    assert.equal(convertToSeconds(2, 'hr'), 7200);
    assert.equal(convertToSeconds(1.5, 'hr'), 5400);
    assert.equal(convertToSeconds(8, 'hr'), 28800);
  });

  test('converts seconds to unit display string', () => {
    assert.equal(convertSecondsToDisplay(1500, 'min'), '25');
    assert.equal(convertSecondsToDisplay(3600, 'min'), '60');
    assert.equal(convertSecondsToDisplay(3600, 'hr'), '1');
    assert.equal(convertSecondsToDisplay(5400, 'hr'), '1.5');
    assert.equal(convertSecondsToDisplay(7200, 'hr'), '2');
  });

  test('parses arbitrary user input strings without 360 min limit', () => {
    assert.equal(parseTimeInputToSeconds('500', 'min'), 30000);
    assert.equal(parseTimeInputToSeconds('1000', 'min'), 60000);
    assert.equal(parseTimeInputToSeconds('4', 'hr'), 14400);
    assert.equal(parseTimeInputToSeconds('2.5', 'hr'), 9000);
    assert.equal(parseTimeInputToSeconds('', 'min'), DEFAULT_FOCUS_MINUTES * 60);
  });

  test('formats session label nicely', () => {
    assert.equal(formatSessionLabel(1500), '25m');
    assert.equal(formatSessionLabel(3600), '1h');
    assert.equal(formatSessionLabel(5400), '1.5h');
    assert.equal(formatSessionLabel(7200), '2h');
  });

  test('formats time in seconds to mm:ss or hh:mm:ss', () => {
    assert.equal(formatFocusTime(0), '00:00');
    assert.equal(formatFocusTime(59), '00:59');
    assert.equal(formatFocusTime(1500), '25:00');
    assert.equal(formatFocusTime(3600), '01:00:00');
    assert.equal(formatFocusTime(28800), '08:00:00');
  });

  test('calculates accurate progress percentage', () => {
    assert.equal(calculateProgressPercent(100, 100), 0);
    assert.equal(calculateProgressPercent(100, 50), 50);
    assert.equal(calculateProgressPercent(100, 0), 100);
  });
});
