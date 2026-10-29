import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { useTasks } from '../tasks/hooks';
import { ambientSoundEngine, AmbientSoundType } from './ambientSounds';
import {
  TimeUnit,
  convertToSeconds,
  convertSecondsToDisplay,
  parseTimeInputToSeconds,
  formatFocusTime,
  formatSessionLabel,
  calculateProgressPercent,
  DEFAULT_FOCUS_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
  DEFAULT_LONG_BREAK_MINUTES,
  MIN_DURATION_SECONDS,
  FOCUS_CUSTOM_STORAGE_KEY,
  FOCUS_CUSTOM_UNIT_KEY,
} from './focusUtils';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CloudRain,
  Radio,
  Wind,
  CheckCircle2,
  Edit2,
  Clock,
  Plus,
  Minus,
} from 'lucide-react';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimerMode = 'focus' | 'short_break' | 'long_break';

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ isOpen, onClose }) => {
  const { tasks } = useTasks();

  // Unit toggle state: 'min' or 'hr'
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(() => {
    try {
      const savedUnit = localStorage.getItem(FOCUS_CUSTOM_UNIT_KEY);
      if (savedUnit === 'hr' || savedUnit === 'min') {
        return savedUnit;
      }
    } catch {}
    return 'min';
  });

  // Focus duration in total seconds (persisted)
  const [focusSeconds, setFocusSeconds] = useState<number>(() => {
    try {
      const savedSeconds = localStorage.getItem(FOCUS_CUSTOM_STORAGE_KEY);
      if (savedSeconds) {
        const parsed = parseInt(savedSeconds, 10);
        if (!isNaN(parsed) && parsed >= MIN_DURATION_SECONDS) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_FOCUS_MINUTES * 60;
  });

  const [shortBreakSeconds, setShortBreakSeconds] = useState<number>(DEFAULT_SHORT_BREAK_MINUTES * 60);
  const [longBreakSeconds, setLongBreakSeconds] = useState<number>(DEFAULT_LONG_BREAK_MINUTES * 60);

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(focusSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [soundType, setSoundType] = useState<AmbientSoundType>('none');
  const [volume, setVolume] = useState(0.4);

  // Manual typing input string
  const [customInput, setCustomInput] = useState<string>(() =>
    convertSecondsToDisplay(focusSeconds, timeUnit)
  );
  const [isEditingInline, setIsEditingInline] = useState(false);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const activeTask = tasks.find((t) => t.id === selectedTaskId);

  // Get current active mode duration in seconds
  const currentTotalSeconds =
    mode === 'focus'
      ? focusSeconds
      : mode === 'short_break'
      ? shortBreakSeconds
      : longBreakSeconds;

  // When focusSeconds changes and timer is idle, update timeLeft
  useEffect(() => {
    if (!isRunning && mode === 'focus') {
      setTimeLeft(focusSeconds);
    }
  }, [focusSeconds, isRunning, mode]);

  // Sync customInput string when focusSeconds or timeUnit changes from outside
  useEffect(() => {
    setCustomInput(convertSecondsToDisplay(focusSeconds, timeUnit));
  }, [focusSeconds, timeUnit]);

  // Focus inline input when editing
  useEffect(() => {
    if (isEditingInline) {
      setTimeout(() => inlineInputRef.current?.select(), 50);
    }
  }, [isEditingInline]);

  // Timer countdown interval effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      ambientSoundEngine.stop();
      if (mode === 'focus') {
        setCompletedSessions((c) => c + 1);
        setMode('short_break');
        setTimeLeft(shortBreakSeconds);
      } else {
        setMode('focus');
        setTimeLeft(focusSeconds);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, focusSeconds, shortBreakSeconds]);

  // Audio effect sync
  useEffect(() => {
    if (isRunning && soundType !== 'none') {
      ambientSoundEngine.play(soundType, volume);
    } else {
      ambientSoundEngine.stop();
    }
    return () => {
      ambientSoundEngine.stop();
    };
  }, [isRunning, soundType]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientSoundEngine.setVolume(newVol);
  };

  const handleModeSwitch = (newMode: TimerMode) => {
    setIsRunning(false);
    setIsEditingInline(false);
    ambientSoundEngine.stop();
    setMode(newMode);
    if (newMode === 'focus') {
      setTimeLeft(focusSeconds);
    } else if (newMode === 'short_break') {
      setTimeLeft(shortBreakSeconds);
    } else {
      setTimeLeft(longBreakSeconds);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsEditingInline(false);
    ambientSoundEngine.stop();
    setTimeLeft(currentTotalSeconds);
  };

  // Unit toggle handler (minutes <-> hours)
  const handleToggleUnit = (newUnit: TimeUnit) => {
    if (newUnit === timeUnit) return;
    setTimeUnit(newUnit);
    try {
      localStorage.setItem(FOCUS_CUSTOM_UNIT_KEY, newUnit);
    } catch {}
    // Recalculate input display string for the new unit
    setCustomInput(convertSecondsToDisplay(focusSeconds, newUnit));
  };

  // Manual typing handler for duration (any number allowed, no 360 cap!)
  const handleDurationTyped = (val: string) => {
    setCustomInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      const calculatedSeconds = convertToSeconds(parsed, timeUnit);
      setFocusSeconds(calculatedSeconds);
      if (!isRunning && mode === 'focus') {
        setTimeLeft(calculatedSeconds);
      }
      try {
        localStorage.setItem(FOCUS_CUSTOM_STORAGE_KEY, String(calculatedSeconds));
      } catch {}
    }
  };

  // Save on blur or form submit
  const handleSaveTypedDuration = () => {
    setIsEditingInline(false);
    const calculatedSeconds = parseTimeInputToSeconds(customInput, timeUnit, focusSeconds);
    setFocusSeconds(calculatedSeconds);
    setCustomInput(convertSecondsToDisplay(calculatedSeconds, timeUnit));
    if (!isRunning && mode === 'focus') {
      setTimeLeft(calculatedSeconds);
    }
    try {
      localStorage.setItem(FOCUS_CUSTOM_STORAGE_KEY, String(calculatedSeconds));
    } catch {}
  };

  // Quick preset click handler
  const handleSelectPreset = (seconds: number) => {
    setIsRunning(false);
    setIsEditingInline(false);
    ambientSoundEngine.stop();
    setFocusSeconds(seconds);
    setCustomInput(convertSecondsToDisplay(seconds, timeUnit));
    setMode('focus');
    setTimeLeft(seconds);
    try {
      localStorage.setItem(FOCUS_CUSTOM_STORAGE_KEY, String(seconds));
    } catch {}
  };

  // Quick step adjustment (+5m or +0.5h, etc.)
  const handleStepAdjust = (direction: 'up' | 'down') => {
    if (isRunning) return;
    const deltaSeconds = timeUnit === 'hr' ? 1800 : 300; // 30 mins or 5 mins
    const nextSeconds =
      direction === 'up'
        ? focusSeconds + deltaSeconds
        : Math.max(MIN_DURATION_SECONDS, focusSeconds - deltaSeconds);

    setFocusSeconds(nextSeconds);
    setCustomInput(convertSecondsToDisplay(nextSeconds, timeUnit));
    if (mode === 'focus') {
      setTimeLeft(nextSeconds);
    }
    try {
      localStorage.setItem(FOCUS_CUSTOM_STORAGE_KEY, String(nextSeconds));
    } catch {}
  };

  const progressPercent = calculateProgressPercent(currentTotalSeconds, timeLeft);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Focus Mode & Time Sync" size="md">
      <div className="space-y-6 text-center">
        {/* Mode Selector */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleModeSwitch('focus')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'focus'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {formatSessionLabel(focusSeconds)} Focus
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('short_break')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'short_break'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {Math.round(shortBreakSeconds / 60)}m Break
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('long_break')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'long_break'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {Math.round(longBreakSeconds / 60)}m Long Break
          </button>
        </div>

        {/* Circular Clock Display with Click-to-Type support */}
        <div className="relative w-48 h-48 mx-auto flex flex-col items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-inner bg-slate-50/50 dark:bg-slate-800/40">
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent transition-all duration-300 pointer-events-none"
            style={{
              borderTopColor: mode === 'focus' ? 'var(--accent-ink)' : '#059669',
              borderRightColor:
                progressPercent > 25 ? (mode === 'focus' ? 'var(--accent-ink)' : '#059669') : 'transparent',
              borderBottomColor:
                progressPercent > 50 ? (mode === 'focus' ? 'var(--accent-ink)' : '#059669') : 'transparent',
              borderLeftColor:
                progressPercent > 75 ? (mode === 'focus' ? 'var(--accent-ink)' : '#059669') : 'transparent',
            }}
          />

          {isEditingInline && !isRunning && mode === 'focus' ? (
            <div className="flex flex-col items-center z-10">
              <div className="flex items-center justify-center gap-1">
                <input
                  ref={inlineInputRef}
                  type="number"
                  step={timeUnit === 'hr' ? '0.25' : '1'}
                  min="0.1"
                  value={customInput}
                  onChange={(e) => handleDurationTyped(e.target.value)}
                  onBlur={handleSaveTypedDuration}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTypedDuration();
                    if (e.key === 'Escape') setIsEditingInline(false);
                  }}
                  className="w-24 h-11 text-2xl font-extrabold text-center font-mono rounded-lg bg-white dark:bg-slate-900 border-2 border-[var(--accent-ink)] text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {timeUnit}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveTypedDuration}
                className="mt-1 text-[10px] text-[var(--accent-ink)] font-semibold hover:underline cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                if (!isRunning && mode === 'focus') {
                  setIsEditingInline(true);
                }
              }}
              className={`group flex flex-col items-center justify-center z-10 ${
                !isRunning && mode === 'focus' ? 'cursor-pointer hover:opacity-90' : ''
              }`}
              title={!isRunning && mode === 'focus' ? 'Click to type custom time' : undefined}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  {formatFocusTime(timeLeft)}
                </span>
                {!isRunning && mode === 'focus' && (
                  <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--accent-ink)] transition-colors opacity-70 group-hover:opacity-100" />
                )}
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-400 mt-1 uppercase tracking-wider">
                {mode === 'focus'
                  ? `${formatSessionLabel(focusSeconds)} Deep Work`
                  : mode === 'short_break'
                  ? 'Recharge'
                  : 'Rest'}
              </span>
            </div>
          )}
        </div>

        {/* Custom Duration Typing & Minutes/Hours Unit Toggle Bar */}
        {mode === 'focus' && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-ink)]" />
                <div>
                  <label
                    htmlFor="custom-focus-input"
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer block"
                  >
                    Set Focus Duration
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Type any number of {timeUnit === 'hr' ? 'hours' : 'minutes'}
                  </span>
                </div>
              </div>

              {/* Input + Stepper + Unit Toggle */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                {/* Stepper buttons */}
                <button
                  type="button"
                  onClick={() => handleStepAdjust('down')}
                  disabled={isRunning || focusSeconds <= (timeUnit === 'hr' ? 1800 : 300)}
                  title={`Subtract ${timeUnit === 'hr' ? '30 mins' : '5 mins'}`}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* Number input (unbounded, allows any number!) */}
                <input
                  id="custom-focus-input"
                  type="number"
                  step={timeUnit === 'hr' ? '0.25' : '1'}
                  min="0.1"
                  value={customInput}
                  onChange={(e) => handleDurationTyped(e.target.value)}
                  onBlur={handleSaveTypedDuration}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTypedDuration()}
                  disabled={isRunning}
                  aria-label={`Focus duration in ${timeUnit === 'hr' ? 'hours' : 'minutes'}`}
                  className="w-20 h-8 text-center text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)] disabled:opacity-50"
                  placeholder={timeUnit === 'hr' ? 'e.g. 2' : 'e.g. 45'}
                />

                <button
                  type="button"
                  onClick={() => handleStepAdjust('up')}
                  disabled={isRunning}
                  title={`Add ${timeUnit === 'hr' ? '30 mins' : '5 mins'}`}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Minutes / Hours Toggle Segmented Control */}
                <div
                  role="group"
                  aria-label="Duration unit selector"
                  className="inline-flex p-0.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-lg border border-slate-300 dark:border-slate-600"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleUnit('min')}
                    disabled={isRunning}
                    aria-pressed={timeUnit === 'min'}
                    className={`px-2 py-1 text-[11px] font-bold rounded-[6px] transition-all cursor-pointer ${
                      timeUnit === 'min'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleUnit('hr')}
                    disabled={isRunning}
                    aria-pressed={timeUnit === 'hr'}
                    className={`px-2 py-1 text-[11px] font-bold rounded-[6px] transition-all cursor-pointer ${
                      timeUnit === 'hr'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    hr
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Presets (covering both short sessions and long deep work hours) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Presets:
              </span>
              {[
                { label: '25m', sec: 25 * 60 },
                { label: '45m', sec: 45 * 60 },
                { label: '1h', sec: 60 * 60 },
                { label: '1.5h', sec: 90 * 60 },
                { label: '2h', sec: 120 * 60 },
                { label: '3h', sec: 180 * 60 },
                { label: '4h', sec: 240 * 60 },
              ].map((preset) => {
                const isSelected = focusSeconds === preset.sec;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset.sec)}
                    disabled={isRunning}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-[var(--accent-ink)] text-white border-transparent shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            title="Reset timer"
            className="w-10 h-10 p-0 rounded-full"
          >
            <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsRunning(!isRunning)}
            className="gap-2 px-6 h-11 rounded-full font-bold shadow-md"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </Button>

          <div className="text-left pl-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block uppercase">
              Sessions
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {completedSessions} done
            </span>
          </div>
        </div>

        {/* Task Binding Selector */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Focus on Specific Task (Optional)
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">-- No specific task attached --</option>
            {tasks
              .filter((t) => t.status === 'pending')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.workspace.toUpperCase()}] {t.title}
                </option>
              ))}
          </select>
          {activeTask && (
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Working on:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-medium">
                {activeTask.title}
              </strong>
            </p>
          )}
        </div>

        {/* Synthesized Ambient Soundscapes */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Ambient Soundscape (Web Audio Synthesizer)
            </span>
            {soundType !== 'none' && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Playing
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { type: 'none' as const, label: 'Off', icon: VolumeX },
              { type: 'rain' as const, label: 'Rain', icon: CloudRain },
              { type: 'whitenoise' as const, label: 'White Noise', icon: Wind },
              { type: 'binaural' as const, label: 'Binaural 10Hz', icon: Radio },
            ].map((item) => {
              const Icon = item.icon;
              const active = soundType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSoundType(item.type)}
                  className={`py-2 px-1 text-center rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-700 border-slate-900 dark:border-white text-slate-900 dark:text-white shadow-xs'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </div>

          {soundType !== 'none' && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 accent-slate-800 dark:accent-slate-200 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
