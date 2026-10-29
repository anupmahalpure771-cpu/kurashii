export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'kurashii_theme';

/**
 * Pure function: resolves 'system' to either 'dark' or 'light'
 * based on whether system prefers dark.
 */
export function resolveEffectiveTheme(mode: ThemeMode, systemPrefersDark: boolean): 'dark' | 'light' {
  if (mode === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

/**
 * Pure function: toggles between 'light' and 'dark'
 */
export function getNextTheme(current: ThemeMode, systemPrefersDark = false): ThemeMode {
  const effective = resolveEffectiveTheme(current, systemPrefersDark);
  return effective === 'dark' ? 'light' : 'dark';
}
