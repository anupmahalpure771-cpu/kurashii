import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { detectMeetingConflict, type Meeting } from './schema.ts';

describe('Meeting pure conflict detection logic', () => {
  const existingMeetings: Meeting[] = [
    {
      id: 'm-1',
      organizerId: 'u-1',
      organizerName: 'Organizer',
      title: 'Sprint Planning',
      description: 'Backlog review',
      date: '2026-10-20',
      startTime: '10:00',
      endTime: '11:00',
      participantUids: ['u-2'],
      status: 'scheduled',
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    },
    {
      id: 'm-2',
      organizerId: 'u-1',
      organizerName: 'Organizer',
      title: 'Cancelled Sync',
      description: '',
      date: '2026-10-20',
      startTime: '14:00',
      endTime: '15:00',
      participantUids: [],
      status: 'cancelled',
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
    },
  ];

  test('detects overlapping meeting on same date', () => {
    const conflict = detectMeetingConflict(existingMeetings, {
      date: '2026-10-20',
      startTime: '10:30',
      endTime: '11:30',
    });
    assert.ok(conflict);
    assert.equal(conflict?.id, 'm-1');
  });

  test('ignores meeting when times are adjacent without overlap', () => {
    const conflict = detectMeetingConflict(existingMeetings, {
      date: '2026-10-20',
      startTime: '11:00',
      endTime: '12:00',
    });
    assert.equal(conflict, null);
  });

  test('ignores cancelled meetings when checking conflicts', () => {
    const conflict = detectMeetingConflict(existingMeetings, {
      date: '2026-10-20',
      startTime: '14:15',
      endTime: '14:45',
    });
    assert.equal(conflict, null);
  });

  test('ignores itself when editing an existing meeting', () => {
    const conflict = detectMeetingConflict(existingMeetings, {
      id: 'm-1',
      date: '2026-10-20',
      startTime: '10:00',
      endTime: '11:00',
    });
    assert.equal(conflict, null);
  });
});
