/**
 * Pure utility functions for the Focus Timer feature with minutes & hours toggle.
 */

export type TimeUnit = 'min' | 'hr';

export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_SHORT_BREAK_MINUTES = 5;
export const DEFAULT_LONG_BREAK_MINUTES = 15;
export const MIN_DURATION_SECONDS = 5; // minimum 5 seconds
export const MAX_DURATION_SECONDS = 86400 * 7; // up to 7 days (essentially unbounded for work)

export const FOCUS_CUSTOM_STORAGE_KEY = 'kurashii_focus_custom_seconds';
export const FOCUS_CUSTOM_UNIT_KEY = 'kurashii_focus_custom_unit';

/**
 * Converts value and unit into total seconds.
 * Supports decimals for hours (e.g. 1.5 hr = 5400s) and integers or floats for minutes.
 */
export function convertToSeconds(value: number, unit: TimeUnit): number {
  if (isNaN(value) || !isFinite(value) || value <= 0) {
    return DEFAULT_FOCUS_MINUTES * 60;
  }
  const multiplier = unit === 'hr' ? 3600 : 60;
  const rawSeconds = Math.round(value * multiplier);
  return Math.min(Math.max(rawSeconds, MIN_DURATION_SECONDS), MAX_DURATION_SECONDS);
}

/**
 * Converts total seconds into the display value string for the given unit.
 */
export function convertSecondsToDisplay(totalSeconds: number, unit: TimeUnit): string {
  if (totalSeconds <= 0) return '0';
  if (unit === 'hr') {
    const hours = totalSeconds / 3600;
    // Round to max 2 decimal places, trimming trailing zeros (e.g. 1.5, 2, 0.75)
    return parseFloat(hours.toFixed(2)).toString();
  }
  const minutes = Math.round(totalSeconds / 60);
  return minutes.toString();
}

/**
 * Parses user input string or number into seconds.
 */
export function parseTimeInputToSeconds(
  input: string | number,
  unit: TimeUnit,
  fallbackSeconds: number = DEFAULT_FOCUS_MINUTES * 60
): number {
  if (typeof input === 'number') {
    return convertToSeconds(input, unit);
  }
  const cleanStr = String(input).trim();
  if (!cleanStr) return fallbackSeconds;

  // Handle "HH:MM:SS" or "MM:SS" format if pasted
  if (cleanStr.includes(':')) {
    const parts = cleanStr.split(':').map((p) => parseFloat(p) || 0);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return Math.round(h * 3600 + m * 60 + s);
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      return Math.round(m * 60 + s);
    }
  }

  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed) || parsed <= 0) return fallbackSeconds;
  return convertToSeconds(parsed, unit);
}

/**
 * Backward compatibility helper for minutes
 */
export function clampDurationMinutes(minutes: number, min: number = 1, max: number = 100000): number {
  if (isNaN(minutes) || !isFinite(minutes)) {
    return DEFAULT_FOCUS_MINUTES;
  }
  return Math.min(Math.max(Math.round(minutes), min), max);
}

/**
 * Backward compatibility helper for parsing minutes
 */
export function parseDurationInput(
  input: string | number,
  fallback: number = DEFAULT_FOCUS_MINUTES
): number {
  return Math.round(parseTimeInputToSeconds(input, 'min', fallback * 60) / 60);
}

/**
 * Formats seconds into MM:SS or HH:MM:SS (or HHH:MM:SS).
 */
export function formatFocusTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Returns human-readable session label based on seconds
 */
export function formatSessionLabel(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const hours = parseFloat((totalSeconds / 3600).toFixed(1));
    return `${hours}h`;
  }
  const mins = Math.round(totalSeconds / 60);
  return `${mins}m`;
}

/**
 * Calculates progress percentage (0 - 100).
 */
export function calculateProgressPercent(totalSeconds: number, timeLeftSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  const elapsed = Math.max(0, totalSeconds - timeLeftSeconds);
  const percent = (elapsed / totalSeconds) * 100;
  return Math.min(100, Math.max(0, percent));
}
