export interface CalendarEvent {
  id: string;
  workspace: 'personal' | 'professional';
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFormData {
  workspace: 'personal' | 'professional';
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
}

export function validateEventTimes(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) return 'Start time and end time are required';
  if (endTime <= startTime) {
    return 'End time must be later than start time';
  }
  return null;
}
