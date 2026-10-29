import { TaskItem } from '../../types/models';
import { CalendarEvent } from '../calendar/schema';
import { HabitItem } from '../goals/schema';

export interface BalanceMetrics {
  score: number; // 0 to 100
  status: 'optimal' | 'work_heavy' | 'personal_heavy' | 'needs_planning';
  personalCount: number;
  workCount: number;
  workMeetingHours: number;
  habitsDoneToday: number;
  habitsTotal: number;
  isQuietHours: boolean;
  quietHoursMessage: string;
}

export function calculateBalanceMetrics(
  tasks: TaskItem[],
  events: CalendarEvent[],
  habits: HabitItem[],
  workStartHour = 9,
  workEndHour = 18
): BalanceMetrics {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowHour = new Date().getHours();

  const isQuietHours = nowHour < workStartHour || nowHour >= workEndHour;

  // Personal tasks & habits
  const personalTasks = tasks.filter((t) => t.workspace === 'personal');
  const personalCompleted = personalTasks.filter((t) => t.status === 'completed').length;

  let habitsDoneToday = 0;
  habits.forEach((h) => {
    if (h.completions && Array.isArray(h.completions) && h.completions.includes(todayStr)) {
      habitsDoneToday++;
    }
  });

  // Work tasks & meetings
  const workTasks = tasks.filter((t) => t.workspace === 'professional');
  const workCompleted = workTasks.filter((t) => t.status === 'completed').length;

  // Estimate meeting hours
  const todayWorkEvents = events.filter(
    (e) => e.workspace === 'professional' && e.date === todayStr
  );
  let workMeetingHours = 0;
  todayWorkEvents.forEach((e) => {
    const [sh, sm] = e.startTime.split(':').map(Number);
    const [eh, em] = e.endTime.split(':').map(Number);
    const diff = eh + em / 60 - (sh + sm / 60);
    workMeetingHours += Math.max(diff, 0.5);
  });

  // Calculate score (balance of personal investment and work completion)
  const personalPoints = personalCompleted * 15 + habitsDoneToday * 20;
  const workPoints = workCompleted * 15 + (workTasks.length > 0 ? 20 : 0);

  const totalPoints = personalPoints + workPoints;
  let score = 75; // baseline
  if (totalPoints > 0) {
    const ratio = personalPoints / totalPoints;
    // ideal ratio is between 0.35 and 0.65
    if (ratio >= 0.35 && ratio <= 0.65) {
      score = 88;
    } else if (ratio < 0.35) {
      score = 62;
    } else {
      score = 70;
    }
  }

  // Adjust for excessive meeting fatigue
  if (workMeetingHours > 4.5) {
    score = Math.max(score - 15, 45);
  }

  let status: BalanceMetrics['status'] = 'optimal';
  if (score >= 80) status = 'optimal';
  else if (workMeetingHours > 4 || workTasks.length > personalTasks.length * 2)
    status = 'work_heavy';
  else if (personalTasks.length > workTasks.length * 2) status = 'personal_heavy';
  else status = 'needs_planning';

  const quietHoursMessage = isQuietHours
    ? 'Work hours have ended. Step away from work alerts and enjoy your personal space.'
    : 'Active work hours. Stay focused and take short recharge breaks.';

  return {
    score: Math.min(Math.max(score, 40), 98),
    status,
    personalCount: personalTasks.length,
    workCount: workTasks.length,
    workMeetingHours: Number(workMeetingHours.toFixed(1)),
    habitsDoneToday,
    habitsTotal: habits.length,
    isQuietHours,
    quietHoursMessage,
  };
}
