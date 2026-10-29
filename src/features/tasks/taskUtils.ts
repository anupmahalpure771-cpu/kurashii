import type { TaskItem, TaskPriority } from '../../types/models';

function isOverdue(dueDateStr: string | null | undefined, todayStr: string): boolean {
  if (!dueDateStr) return false;
  return dueDateStr < todayStr;
}

function isDueToday(dueDateStr: string | null | undefined, todayStr: string): boolean {
  if (!dueDateStr) return false;
  return dueDateStr === todayStr;
}

function isDueThisWeek(dueDateStr: string | null | undefined, todayStr: string): boolean {
  if (!dueDateStr) return false;
  if (dueDateStr < todayStr) return false;
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [dY, dM, dD] = dueDateStr.split('-').map(Number);
  const todayDate = new Date(Date.UTC(tY, tM - 1, tD));
  const dueDate = new Date(Date.UTC(dY, dM - 1, dD));
  const diffDays = (dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Sort specification: Overdue first, then due date, then priority.
 */
export function sortTasks(tasks: TaskItem[], todayStr: string): TaskItem[] {
  return [...tasks].sort((a, b) => {
    // If one is completed and one is pending, keep pending on top if sorting mixed,
    // but usually they are viewed in separate tabs
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }

    const aOverdue = a.status === 'pending' && isOverdue(a.dueDate, todayStr);
    const bOverdue = b.status === 'pending' && isOverdue(b.dueDate, todayStr);

    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Both overdue or neither overdue: check due date
    if (a.dueDate && b.dueDate) {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
    } else if (a.dueDate && !b.dueDate) {
      return -1;
    } else if (!a.dueDate && b.dueDate) {
      return 1;
    }

    // Tie-break with priority
    const pA = PRIORITY_WEIGHT[a.priority] || 0;
    const pB = PRIORITY_WEIGHT[b.priority] || 0;
    if (pA !== pB) {
      return pB - pA; // higher priority first
    }

    return (a.title || '').localeCompare(b.title || '');
  });
}

export interface TaskFilterOptions {
  status: 'pending' | 'completed';
  search?: string;
  priority?: string;
  category?: string;
  dueFilter?: string; // 'all' | 'overdue' | 'today' | 'this_week' | 'no_date'
}

export function filterTasks(
  tasks: TaskItem[],
  options: TaskFilterOptions,
  todayStr: string
): TaskItem[] {
  return tasks.filter((task) => {
    // Status filter
    if (task.status !== options.status) {
      return false;
    }

    // Search query on title and description
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Priority filter
    if (options.priority && options.priority !== 'all') {
      if (task.priority !== options.priority) return false;
    }

    // Category filter
    if (options.category && options.category !== 'all') {
      if (task.category !== options.category) return false;
    }

    // Due date filter
    if (options.dueFilter && options.dueFilter !== 'all') {
      if (options.dueFilter === 'overdue') {
        if (!isOverdue(task.dueDate, todayStr)) return false;
      } else if (options.dueFilter === 'today') {
        if (!isDueToday(task.dueDate, todayStr)) return false;
      } else if (options.dueFilter === 'this_week') {
        if (!isDueThisWeek(task.dueDate, todayStr)) return false;
      } else if (options.dueFilter === 'no_date') {
        if (task.dueDate) return false;
      }
    }

    return true;
  });
}
