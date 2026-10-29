/**
 * Timezone-aware date helper functions.
 * Stored dates are in YYYY-MM-DD format.
 */

export function getUserDefaultTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'UTC';
  }
}

/**
 * Returns today's date formatted as YYYY-MM-DD in the target timezone
 */
export function getTodayDateString(timeZone: string = getUserDefaultTimeZone()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}

/**
 * Formats YYYY-MM-DD into a human-readable string like '15 Oct 2026'
 */
export function formatReadableDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Checks if a date string is strictly before today's date string (lexicographical comparison works on YYYY-MM-DD)
 */
export function isOverdue(dueDateStr: string | null | undefined, todayStr: string = getTodayDateString()): boolean {
  if (!dueDateStr) return false;
  return dueDateStr < todayStr;
}

export function isDueToday(dueDateStr: string | null | undefined, todayStr: string = getTodayDateString()): boolean {
  if (!dueDateStr) return false;
  return dueDateStr === todayStr;
}

export function isDueThisWeek(dueDateStr: string | null | undefined, todayStr: string = getTodayDateString()): boolean {
  if (!dueDateStr) return false;
  if (dueDateStr < todayStr) return false;
  
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [dY, dM, dD] = dueDateStr.split('-').map(Number);
  
  const todayDate = new Date(Date.UTC(tY, tM - 1, tD));
  const dueDate = new Date(Date.UTC(dY, dM - 1, dD));
  
  const diffDays = (dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

/**
 * Greeting based on current local hour in the user's timezone
 */
export function getTimeOfDayGreeting(timeZone: string = getUserDefaultTimeZone()): string {
  try {
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone,
    });
    const hour = parseInt(hourFormatter.format(new Date()), 10);
    if (hour >= 4 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  } catch {
    return 'Welcome';
  }
}
