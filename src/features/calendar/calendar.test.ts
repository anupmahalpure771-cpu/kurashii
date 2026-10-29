import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateEventTimes } from './schema.ts';

describe('Calendar pure validation logic', () => {
  test('validates correct start and end times', () => {
    assert.equal(validateEventTimes('09:00', '10:00'), null);
    assert.equal(validateEventTimes('14:30', '15:15'), null);
  });

  test('rejects end time earlier than or equal to start time', () => {
    assert.equal(
      validateEventTimes('10:00', '09:00'),
      'End time must be later than start time'
    );
    assert.equal(
      validateEventTimes('10:00', '10:00'),
      'End time must be later than start time'
    );
  });

  test('rejects missing times', () => {
    assert.equal(
      validateEventTimes('', '10:00'),
      'Start time and end time are required'
    );
    assert.equal(
      validateEventTimes('09:00', ''),
      'Start time and end time are required'
    );
  });
});
