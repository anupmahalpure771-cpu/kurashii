import test from 'node:test';
import assert from 'node:assert/strict';
import { sortTasks, filterTasks } from './taskUtils.ts';
import type { TaskItem } from '../../types/models.ts';

const mockTasks: TaskItem[] = [
  {
    id: '1',
    workspace: 'personal',
    title: 'Clean room',
    priority: 'low',
    category: 'Home',
    dueDate: '2026-10-20',
    status: 'pending',
    completedAt: null,
  },
  {
    id: '2',
    workspace: 'personal',
    title: 'Tax payment',
    priority: 'high',
    category: 'Errands',
    dueDate: '2026-10-10', // Overdue relative to 2026-10-15
    status: 'pending',
    completedAt: null,
  },
  {
    id: '3',
    workspace: 'personal',
    title: 'Workout',
    priority: 'medium',
    category: 'Health',
    dueDate: '2026-10-15', // Today
    status: 'pending',
    completedAt: null,
  },
  {
    id: '4',
    workspace: 'personal',
    title: 'Read book',
    priority: 'high',
    category: 'Learning',
    dueDate: null, // No date
    status: 'pending',
    completedAt: null,
  },
];

test('sortTasks places overdue tasks first, then by date, then by priority', () => {
  const sorted = sortTasks(mockTasks, '2026-10-15');
  assert.equal(sorted[0].id, '2'); // Tax payment is overdue
  assert.equal(sorted[1].id, '3'); // Workout is due today (2026-10-15)
  assert.equal(sorted[2].id, '1'); // Clean room is due 2026-10-20
  assert.equal(sorted[3].id, '4'); // Read book has no date
});

test('filterTasks correctly filters by status, search, and category', () => {
  const pending = filterTasks(mockTasks, { status: 'pending' }, '2026-10-15');
  assert.equal(pending.length, 4);

  const searched = filterTasks(mockTasks, { status: 'pending', search: 'tax' }, '2026-10-15');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, '2');

  const overdue = filterTasks(mockTasks, { status: 'pending', dueFilter: 'overdue' }, '2026-10-15');
  assert.equal(overdue.length, 1);
  assert.equal(overdue[0].id, '2');
});
