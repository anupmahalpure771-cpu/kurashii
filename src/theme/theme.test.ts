import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEffectiveTheme, getNextTheme, THEME_STORAGE_KEY } from './themeUtils.ts';

describe('Theme Pure Logic & Resolution', () => {
  test('has consistent storage key', () => {
    assert.equal(THEME_STORAGE_KEY, 'kurashii_theme');
  });

  test('correctly resolves explicit light theme', () => {
    assert.equal(resolveEffectiveTheme('light', false), 'light');
    assert.equal(resolveEffectiveTheme('light', true), 'light');
  });

  test('correctly resolves explicit dark theme', () => {
    assert.equal(resolveEffectiveTheme('dark', false), 'dark');
    assert.equal(resolveEffectiveTheme('dark', true), 'dark');
  });

  test('correctly resolves system theme based on system preference', () => {
    assert.equal(resolveEffectiveTheme('system', false), 'light');
    assert.equal(resolveEffectiveTheme('system', true), 'dark');
  });

  test('correctly toggles between light and dark', () => {
    assert.equal(getNextTheme('light'), 'dark');
    assert.equal(getNextTheme('dark'), 'light');
    assert.equal(getNextTheme('system', false), 'dark');
    assert.equal(getNextTheme('system', true), 'light');
  });
});
