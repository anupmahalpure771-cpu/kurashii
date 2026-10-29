export interface GoalItem {
  id: string;
  workspace: 'personal' | 'professional';
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  currentProgress: number;
  targetProgress: number;
  unit: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalFormData {
  workspace: 'personal' | 'professional';
  title: string;
  description: string;
  targetDate: string;
  currentProgress: number;
  targetProgress: number;
  unit: string;
  category: string;
}

export interface HabitItem {
  id: string;
  workspace: 'personal' | 'professional';
  name: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  category: string;
  completions: string[]; // List of YYYY-MM-DD strings
  createdAt: string;
  updatedAt: string;
}

export interface HabitFormData {
  workspace: 'personal' | 'professional';
  name: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  category: string;
}

export function calculateHabitStreak(completions: string[], todayStr: string): number {
  if (!completions || completions.length === 0) return 0;
  const set = new Set(completions);
  let streak = 0;
  const cur = new Date(todayStr);

  // If not completed today, check if completed yesterday to keep streak alive
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (!set.has(fmt(cur))) {
    cur.setDate(cur.getDate() - 1);
  }

  while (set.has(fmt(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  return streak;
}
