import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ui/Toast';
import { AVATAR_COLORS, Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useTheme } from '../../theme/ThemeProvider';
import { ThemeMode } from '../../theme/themeUtils';
import { writeBatch, doc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { WorkspaceType, CurrencyCode } from '../../types/models';
import { toMinorUnits, fromMinorUnits } from '../../lib/money';
import { mapAuthError } from '../../auth/authErrors';
import {
  Check,
  Shield,
  User,
  Sliders,
  LogOut,
  Info,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, userProfile, updateProfile, refreshProfile, logout, sendResetEmail } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { theme, isDark, setTheme, toggleTheme } = useTheme();

  // Profile Form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [avatarColor, setAvatarColor] = useState(userProfile?.avatarColor || AVATAR_COLORS[0].hex);
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences Form state
  const [primaryUse, setPrimaryUse] = useState<WorkspaceType>(userProfile?.primaryUse || 'personal');
  const [timezone, setTimezone] = useState(userProfile?.timezone || 'Asia/Kolkata');
  const [currency, setCurrency] = useState<CurrencyCode>(userProfile?.currency || 'INR');
  const [defaultBudget, setDefaultBudget] = useState<number>(
    userProfile?.defaultMonthlyBudgetMinor ? fromMinorUnits(userProfile.defaultMonthlyBudgetMinor) : 0
  );
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Security Form state
  const isPasswordUser = user?.providerData?.some((p) => p.providerId === 'password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [tzFilter, setTzFilter] = useState('');

  // Available IANA timezones
  const availableTimezones = React.useMemo(() => {
    try {
      if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        return (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf('timeZone');
      }
    } catch {}
    return [
      'Asia/Kolkata',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Asia/Dubai',
      'Australia/Sydney',
      'UTC',
    ];
  }, []);

  const filteredTimezones = React.useMemo(() => {
    if (!tzFilter.trim()) return availableTimezones;
    const q = tzFilter.toLowerCase().trim();
    return availableTimezones.filter((tz) => tz.toLowerCase().includes(q));
  }, [availableTimezones, tzFilter]);

  // Logout dialog
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleToggleTheme = () => {
    const nextIsDark = !isDark;
    toggleTheme();
    toast.success(nextIsDark ? 'Switched to Dark Mode' : 'Switched to Light Mode');
    if (user) {
      updateProfile({ theme: nextIsDark ? 'dark' : 'light' }).catch(() => {});
    }
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode);
    const label = mode === 'dark' ? 'Dark Mode' : mode === 'light' ? 'Light Mode' : 'System Theme';
    toast.success(`Theme set to ${label}`);
    if (user) {
      updateProfile({ theme: mode }).catch(() => {});
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    if (displayName.trim().length < 2 || displayName.trim().length > 40) {
      toast.error('Display name must be 2–40 characters');
      return;
    }

    setSavingProfile(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);
      const publicProfileRef = doc(db, 'publicProfiles', user.uid);
      const now = new Date().toISOString();

      batch.update(userRef, {
        displayName: displayName.trim(),
        avatarColor,
        updatedAt: now,
      });

      batch.update(publicProfileRef, {
        displayName: displayName.trim(),
        avatarColor,
        updatedAt: now,
      });

      await batch.commit();
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingPreferences(true);
    try {
      await updateProfile({
        primaryUse,
        timezone: timezone.trim(),
        currency,
        defaultMonthlyBudgetMinor: toMinorUnits(Number(defaultBudget) || 0),
      });
      toast.success('Preferences saved');
    } catch (err) {
      console.error('Failed to update preferences:', err);
      toast.error('Failed to update preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('New password must be at least 8 characters with a letter and a number.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (!user || !user.email) return;

    setUpdatingPassword(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password changed successfully');
    } catch (err) {
      setPasswordError(mapAuthError(err));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    try {
      await sendResetEmail(user.email);
      setResetEmailSent(true);
      toast.success('Password reset email sent');
    } catch {
      toast.error('Failed to send reset email');
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Failed to log out');
    } finally {
      setLoggingOut(false);
    }
  };

  const currencyOptions = [
    { value: 'INR', label: 'INR (₹) - Indian Rupee' },
    { value: 'USD', label: 'USD ($) - US Dollar' },
    { value: 'EUR', label: 'EUR (€) - Euro' },
    { value: 'GBP', label: 'GBP (£) - British Pound' },
    { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
    { value: 'SGD', label: 'SGD ($) - Singapore Dollar' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 dark:text-white tracking-tight">
          Settings &amp; Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account identity, theme appearance, workspace defaults, and security
        </p>
      </div>

      {/* Appearance & Theme Section */}
      <Card>
        <div className="flex items-center justify-between gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {isDark ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white">
              Appearance &amp; Theme
            </h2>
          </div>

          {/* Quick Header Toggle Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleTheme}
            className="gap-2"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Switch to Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                <span>Switch to Dark Mode</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose between light mode for daytime clarity or dark mode for reduced eyestrain in dim lighting. Changes apply instantly across all dashboards, workspaces, and dialogs.
          </p>

          {/* Visual Theme Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Light Mode Card */}
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`p-4 rounded-[14px] border text-left transition-all duration-150 cursor-pointer relative flex flex-col justify-between ${
                theme === 'light'
                  ? 'border-[var(--accent-ink)] ring-2 ring-[var(--accent-ink)] bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  {theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-[var(--accent-ink)] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Light Mode</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Crisp daytime theme with clean slate surfaces
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A7F3D0] border border-emerald-400" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Mint / Sky accents</span>
              </div>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`p-4 rounded-[14px] border text-left transition-all duration-150 cursor-pointer relative flex flex-col justify-between ${
                theme === 'dark'
                  ? 'border-[var(--accent-ink)] ring-2 ring-[var(--accent-ink)] bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-slate-900 text-indigo-400 border border-slate-800 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  {theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-[var(--accent-ink)] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Dark Mode</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Deep obsidian palette with comfortable night contrast
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Night mode surfaces</span>
              </div>
            </button>

            {/* System Theme Card */}
            <button
              type="button"
              onClick={() => handleSelectTheme('system')}
              className={`p-4 rounded-[14px] border text-left transition-all duration-150 cursor-pointer relative flex flex-col justify-between ${
                theme === 'system'
                  ? 'border-[var(--accent-ink)] ring-2 ring-[var(--accent-ink)] bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  {theme === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-[var(--accent-ink)] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white">System Sync</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Automatically sync with your OS appearance preferences
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Resolved: {isDark ? 'Dark OS' : 'Light OS'}
                </span>
              </div>
            </button>
          </div>

          {/* Quick toggle row with button and switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[12px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Active Display: <span className="text-[var(--accent-ink)] font-bold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isDark
                    ? 'Obsidian night surfaces active across tasks, calendar, notes & modules'
                    : 'Clean daylight surfaces active across tasks, calendar, notes & modules'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Switch
                label="Dark Mode"
                checked={isDark}
                onChange={() => handleToggleTheme()}
              />
              <Button
                type="button"
                variant={isDark ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleToggleTheme}
                className="gap-1.5"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Section */}
      <Card>
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white">Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={displayName || userProfile?.handle || 'U'} avatarColor={avatarColor} size="lg" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Avatar Color
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    aria-label={`Select ${col.label}`}
                    onClick={() => setAvatarColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-150 flex items-center justify-center ${
                      avatarColor === col.hex
                        ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110'
                        : 'hover:scale-105 opacity-90'
                    }`}
                  >
                    {avatarColor === col.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Handle (Read-only)
              </label>
              <input
                type="text"
                readOnly
                value={`@${userProfile?.handle || ''}`}
                className="w-full h-10 px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-[10px] text-slate-500 dark:text-slate-400 cursor-not-allowed select-all"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Unique handle is permanent once created.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Preferences Section */}
      <Card>
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white">Workspace Preferences</h2>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Landing Space"
              value={primaryUse}
              onChange={(e) => setPrimaryUse(e.target.value as WorkspaceType)}
              options={[
                { value: 'personal', label: 'Personal Workspace' },
                { value: 'professional', label: 'Professional Workspace' },
              ]}
              helperText="Workspace opened immediately upon logging in"
            />

            <Select
              label="Default Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              options={currencyOptions}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Timezone
                </label>
                <input
                  type="text"
                  placeholder="Filter timezones..."
                  value={tzFilter}
                  onChange={(e) => setTzFilter(e.target.value)}
                  className="h-6 w-32 px-2 text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent-ink)]"
                />
              </div>
              <Select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={filteredTimezones.map((tz) => ({ value: tz, label: tz }))}
                helperText="Select from IANA supported time zones"
              />
            </div>

            <Input
              label="Default Monthly Budget"
              type="number"
              min="0"
              step="1"
              value={defaultBudget}
              onChange={(e) => setDefaultBudget(Number(e.target.value))}
              helperText="In major currency units (e.g. 5000)"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={savingPreferences}>
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* Security Section */}
      <Card>
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Shield className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white">Security</h2>
        </div>

        {isPasswordUser ? (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg" noValidate>
            {passwordError && (
              <div
                role="alert"
                className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-400 rounded-[10px] font-medium"
              >
                {passwordError}
              </div>
            )}

            <Input
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              rightElement={
                <button
                  type="button"
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              helperText="At least 8 characters with a letter and a number"
              rightElement={
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Input
              label="Confirm New Password"
              type={showConfirmNewPassword ? 'text' : 'password'}
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              rightElement={
                <button
                  type="button"
                  aria-label={showConfirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                >
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={updatingPassword}>
                Change Password
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendReset}
                disabled={resetEmailSent}
              >
                {resetEmailSent ? 'Reset Email Sent' : 'Send Reset Email'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You are signed in via Google Authentication. Password management is managed directly through your Google account.
            </p>
          </div>
        )}
      </Card>

      {/* Account Deletion & Logout Panel */}
      <Card>
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Info className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white">Account Management</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-[12px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Account Deletion</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              To request full account deletion and complete erasure of all workspaces, tasks, and data records, please submit a request to support with your unique handle (@{userProfile?.handle}). Self-service deletion is deferred to a future maintenance update.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.email}</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutConfirm(true)}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/60 gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Logout confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Log Out of Kurashii"
        description="Are you sure you want to log out? Your data is saved and synced to the cloud."
        confirmLabel="Log out"
        isDestructive={false}
        isLoading={loggingOut}
      />
    </div>
  );
};
