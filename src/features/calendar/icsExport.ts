import { CalendarEvent } from './schema';

/**
 * Generates an RFC-5545 compliant .ics calendar file content
 */
export function generateICS(events: CalendarEvent[]): string {
  const formatDateToICS = (dateStr: string, timeStr: string): string => {
    // dateStr: YYYY-MM-DD, timeStr: HH:mm
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = timeStr.replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kurashii//Kurashii Calendar Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((evt) => {
    const dtStart = formatDateToICS(evt.date, evt.startTime);
    const dtEnd = formatDateToICS(evt.date, evt.endTime);
    const summary = evt.title.replace(/[,;\\]/g, '\\$&');
    const description = (evt.description || '').replace(/\n/g, '\\n').replace(/[,;\\]/g, '\\$&');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${evt.id}@kurashii.app`);
    lines.push(`DTSTAMP:${dtStart}Z`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);
    lines.push(`CATEGORIES:${evt.category},${evt.workspace.toUpperCase()}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers browser download of .ics file
 */
export function downloadICS(events: CalendarEvent[], filename = 'kurashii-calendar.ics') {
  const content = generateICS(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
