import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { WorkspaceType, CurrencyCode } from '../types/models';
import { getUserDefaultTimeZone } from '../lib/dates';
import { AVATAR_COLORS, Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Logo } from '../components/ui/Logo';
import { User, Briefcase, Check, X, Loader2 } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // If already completed onboarding, redirect to workspace
  useEffect(() => {
    if (userProfile?.onboardingComplete) {
      navigate(userProfile.lastWorkspace === 'professional' ? '/app/work' : '/app/personal', { replace: true });
    }
  }, [userProfile, navigate]);

  // Step 1: primary use
  const [step, setStep] = useState<1 | 2>(1);
  const [primaryUse, setPrimaryUse] = useState<WorkspaceType>('personal');

  // Step 2: handle, timezone, currency, avatar color, display name
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [handleError, setHandleError] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState(getUserDefaultTimeZone());
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].hex);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Suggest initial handle from email or displayName
  useEffect(() => {
    if (!handle) {
      const base = (user?.displayName || user?.email?.split('@')[0] || '')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15);
      if (base.length >= 3) {
        setHandle(base);
      }
    }
    if (!displayName && user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, handle, displayName]);

  // Debounced live handle check
  useEffect(() => {
    const clean = handle.trim().toLowerCase();
    if (!clean) {
      setHandleStatus('idle');
      setHandleError(null);
      return;
    }

    const handleRegex = /^[a-z0-9_]{3,20}$/;
    if (!handleRegex.test(clean)) {
      setHandleStatus('invalid');
      setHandleError('Handle must be 3–20 characters, lowercase a–z, 0–9, or underscore.');
      return;
    }

    setHandleStatus('checking');
    setHandleError(null);

    const timer = setTimeout(async () => {
      try {
        const handleSnap = await getDoc(doc(db, 'handles', clean));
        if (handleSnap.exists()) {
          setHandleStatus('taken');
          setHandleError('This handle is already taken. Try another.');
        } else {
          setHandleStatus('available');
          setHandleError(null);
        }
      } catch (err) {
        console.warn('Error checking handle availability:', err);
        setHandleStatus('idle');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [handle]);

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanHandle = handle.trim().toLowerCase();
    if (handleStatus !== 'available' && handleStatus !== 'idle') {
      setFormError('Please choose a valid and available handle.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const handleDocRef = doc(db, 'handles', cleanHandle);
      const userDocRef = doc(db, 'users', user.uid);
      const publicProfileDocRef = doc(db, 'publicProfiles', user.uid);

      await runTransaction(db, async (tx) => {
        // Prevent duplicate or overwrite if user profile already exists with onboardingComplete
        const userDoc = await tx.get(userDocRef);
        if (userDoc.exists() && userDoc.data()?.onboardingComplete) {
          throw new Error('PROFILE_ALREADY_EXISTS');
        }

        const handleDoc = await tx.get(handleDocRef);
        if (handleDoc.exists()) {
          throw new Error('HANDLE_ALREADY_TAKEN');
        }

        const finalName = displayName.trim() || user.displayName || cleanHandle;

        tx.set(handleDocRef, { uid: user.uid });
        tx.set(userDocRef, {
          email: user.email || '',
          displayName: finalName,
          handle: cleanHandle,
          primaryUse,
          lastWorkspace: primaryUse,
          timezone: timeZone,
          currency,
          defaultMonthlyBudgetMinor: 0,
          theme: 'light',
          avatarColor,
          onboardingComplete: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        tx.set(publicProfileDocRef, {
          displayName: finalName,
          handle: cleanHandle,
          avatarColor,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await refreshProfile();
      navigate(primaryUse === 'professional' ? '/app/work' : '/app/personal', { replace: true });
    } catch (err: unknown) {
      if ((err as Error)?.message === 'PROFILE_ALREADY_EXISTS') {
        navigate('/app', { replace: true });
        return;
      }
      if ((err as Error)?.message === 'HANDLE_ALREADY_TAKEN') {
        setHandleStatus('taken');
        setHandleError('This handle was just taken. Please choose another.');
        setFormError('This handle was just taken. Please choose another.');
      } else {
        console.error('Onboarding transaction failed:', err);
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        setFormError((err as Error)?.message || 'Failed to complete onboarding. Please try again.');
      }
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-6">
        <Logo size={32} />
        <h1 className="mt-4 text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">
          Welcome to Kurashii
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Step {step} of 2 — Set up your shared balance
        </p>

        {/* Progress indicator */}
        <div className="mt-4 max-w-xs mx-auto flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-900" />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              step === 2 ? 'bg-slate-900' : 'bg-slate-300'
            }`}
          />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/90 rounded-[16px]">
          {formError && (
            <div className="mb-5 p-3 rounded-[10px] bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}

          {step === 1 ? (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-heading font-semibold text-lg text-slate-900">
                  How will you mainly use Kurashii?
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  This sets where you land when you log in. You&apos;ll always have both spaces, and you can change this in Settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Personal Card */}
                <button
                  type="button"
                  onClick={() => setPrimaryUse('personal')}
                  className={`p-5 rounded-[16px] text-left border-2 transition-all cursor-pointer flex flex-col justify-between h-44 ${
                    primaryUse === 'personal'
                      ? 'border-[#047857] bg-[#ECFDF5] shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#A7F3D0] flex items-center justify-center text-[#047857]">
                      <User className="w-5 h-5" />
                    </div>
                    {primaryUse === 'personal' && (
                      <span className="w-6 h-6 rounded-full bg-[#047857] text-white flex items-center justify-center text-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">Personal space</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Daily habits, personal tasks, money, calendar, and wellbeing.
                    </p>
                  </div>
                </button>

                {/* Professional Card */}
                <button
                  type="button"
                  onClick={() => setPrimaryUse('professional')}
                  className={`p-5 rounded-[16px] text-left border-2 transition-all cursor-pointer flex flex-col justify-between h-44 ${
                    primaryUse === 'professional'
                      ? 'border-[#1D4ED8] bg-[#EFF6FF] shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#93C5FD] flex items-center justify-center text-[#1D4ED8]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    {primaryUse === 'professional' && (
                      <span className="w-6 h-6 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center text-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900">Professional space</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Work tasks, projects, meetings, team contacts, and minutes.
                    </p>
                  </div>
                </button>
              </div>

              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => setStep(2)}
              >
                Continue to Profile Setup
              </Button>
            </div>
          ) : (
            <form onSubmit={handleFinish} className="space-y-5">
              <div className="text-center mb-4">
                <h2 className="font-heading font-semibold text-lg text-slate-900">
                  Set up your profile & identity
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose your unique handle and default preferences
                </p>
              </div>

              {/* Display Name */}
              <Input
                label="Display name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Parker"
              />

              {/* Handle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Unique Handle (@)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-sm">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="alexparker"
                    className={`w-full h-10 pl-8 pr-10 py-2 text-sm bg-white border rounded-[10px] text-slate-900 transition-colors ${
                      handleError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                        : handleStatus === 'available'
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-slate-900'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {handleStatus === 'checking' && (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    )}
                    {handleStatus === 'available' && (
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    )}
                    {(handleStatus === 'taken' || handleStatus === 'invalid') && (
                      <X className="w-4 h-4 text-red-500 stroke-[2.5]" />
                    )}
                  </div>
                </div>
                {handleError ? (
                  <p className="text-xs text-red-600 mt-1 font-medium">{handleError}</p>
                ) : handleStatus === 'available' ? (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">@{handle} is available!</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">3–20 characters, lowercase letters, numbers, underscore.</p>
                )}
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Avatar Color
                </label>
                <div className="flex items-center gap-3">
                  <Avatar name={displayName || handle || 'U'} avatarColor={avatarColor} size="lg" />
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
                            ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                            : 'hover:scale-105 opacity-90'
                        }`}
                      >
                        {avatarColor === col.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Currency & Time Zone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  options={currencyOptions}
                />
                <Input
                  label="Time zone"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  helperText="Pre-filled from system"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={submitting}
                  disabled={handleStatus !== 'available' && handle.length < 3}
                >
                  Complete Setup & Open Kurashii
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
