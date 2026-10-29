import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useWorkspace } from '../../workspace/useWorkspace';
import { GoalItem, GoalFormData, HabitItem, HabitFormData, calculateHabitStreak } from './schema';
import {
  subscribeUserGoals,
  subscribeUserHabits,
  createGoal,
  updateGoal,
  deleteGoal,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
} from './api';
import { GoalFormDialog } from './components/GoalFormDialog';
import { HabitFormDialog } from './components/HabitFormDialog';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatReadableDate } from '../../lib/dates';
import { SearchGroundingModal } from '../searchGrounding/SearchGroundingModal';
import {
  Target,
  Sparkles,
  Plus,
  Flame,
  Check,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Globe,
} from 'lucide-react';
import { subDays, format } from 'date-fns';

export const GoalsPage: React.FC = () => {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [workspaceFilter, setWorkspaceFilter] = useState<'all' | 'personal' | 'professional'>(
    workspace
  );

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);

  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);

  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchGroundingOpen, setSearchGroundingOpen] = useState(false);
  const [searchGroundingQuery, setSearchGroundingQuery] = useState('');

  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  // Past 7 days array for habit history
  const past7Days: { dateStr: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    past7Days.push({
      dateStr: format(d, 'yyyy-MM-dd'),
      label: format(d, 'EEE'),
    });
  }

  useEffect(() => {
    setWorkspaceFilter(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubGoals = subscribeUserGoals(
      user.uid,
      (list) => {
        setGoals(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubHabits = subscribeUserHabits(user.uid, (list) => {
      setHabits(list);
    });

    return () => {
      unsubGoals();
      unsubHabits();
    };
  }, [user]);

  const filteredGoals = goals.filter((g) => {
    if (workspaceFilter === 'all') return true;
    return g.workspace === workspaceFilter;
  });

  const filteredHabits = habits.filter((h) => {
    if (workspaceFilter === 'all') return true;
    return h.workspace === workspaceFilter;
  });

  // Goal actions
  const handleSaveGoal = async (data: GoalFormData) => {
    if (!user) return;
    if (editingGoal) {
      await updateGoal(user.uid, editingGoal.id, data);
    } else {
      await createGoal(user.uid, data);
    }
    setEditingGoal(null);
  };

  const handleIncrementGoal = async (goal: GoalItem) => {
    if (!user) return;
    const nextVal = Math.min(goal.targetProgress, goal.currentProgress + 1);
    await updateGoal(user.uid, goal.id, { currentProgress: nextVal });
  };

  const handleDeleteGoal = async () => {
    if (!user || !deletingGoalId) return;
    setDeleteLoading(true);
    try {
      await deleteGoal(user.uid, deletingGoalId);
      setDeletingGoalId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Habit actions
  const handleSaveHabit = async (data: HabitFormData) => {
    if (!user) return;
    if (editingHabit) {
      await updateHabit(user.uid, editingHabit.id, data);
    } else {
      await createHabit(user.uid, data);
    }
    setEditingHabit(null);
  };

  const handleToggleHabit = async (habit: HabitItem, dateStr: string) => {
    if (!user) return;
    await toggleHabitCompletion(user.uid, habit.id, dateStr, habit.completions);
  };

  const handleDeleteHabit = async () => {
    if (!user || !deletingHabitId) return;
    setDeleteLoading(true);
    try {
      await deleteHabit(user.uid, deletingHabitId);
      setDeletingHabitId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-emerald-600" />
            <span>Goals &amp; Daily Habits</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track measurable milestones and nurture daily compounding routines.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchGroundingQuery(
                workspaceFilter === 'personal'
                  ? 'Latest science-backed methods for building consistent daily habits and 10k steps'
                  : 'Effective OKR and goal-tracking frameworks for high-performing engineering teams'
              );
              setSearchGroundingOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 transition-colors shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Search Intel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingHabit(null);
              setHabitDialogOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>New Habit</span>
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setEditingGoal(null);
              setGoalDialogOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </Button>
        </div>
      </div>

      {/* Workspace filter segmented selector */}
      <div className="inline-flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex-wrap sm:flex-nowrap">
        <button
          type="button"
          onClick={() => setWorkspaceFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
            workspaceFilter === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>All Workspaces</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold">
            {goals.length}
          </span>
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1 shrink-0" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setWorkspaceFilter('personal')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
            workspaceFilter === 'personal'
              ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-200/80 dark:border-emerald-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <span>Personal</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
            {goals.filter((g) => g.workspace === 'personal').length}
          </span>
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1 shrink-0" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setWorkspaceFilter('professional')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
            workspaceFilter === 'professional'
              ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-300 shadow-xs border border-blue-200/80 dark:border-blue-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
          <span>Professional</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold">
            {goals.filter((g) => g.workspace === 'professional').length}
          </span>
        </button>
      </div>

      {/* Section 1: Measurable Goals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-slate-700" />
            <span>Active Goals ({filteredGoals.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading goals...</div>
        ) : filteredGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No active goals set"
            description="Create clear, quantifiable goals with target completion dates."
            actionLabel="Create Goal"
            onAction={() => {
              setEditingGoal(null);
              setGoalDialogOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map((goal) => {
              const isPersonal = goal.workspace === 'personal';
              const pct = Math.min(
                100,
                Math.round((goal.currentProgress / goal.targetProgress) * 100)
              );

              return (
                <Card
                  key={goal.id}
                  hoverEffect
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isPersonal
                      ? 'border-emerald-200/80 bg-white hover:border-emerald-400'
                      : 'border-blue-200/80 bg-white hover:border-blue-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isPersonal
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isPersonal ? '🌱 Personal' : '💼 Professional'}
                      </span>

                      {goal.category && (
                        <Badge variant="neutral" className="text-[10px]">
                          {goal.category}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      {goal.title}
                    </h3>

                    {goal.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {goal.description}
                      </p>
                    )}

                    {/* Progress Bar & Numeric Indicator */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">
                          {goal.currentProgress} / {goal.targetProgress} {goal.unit}
                        </span>
                        <span className="font-bold text-slate-700">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isPersonal ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer with target date, quick +1 button, edit/delete */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatReadableDate(goal.targetDate)}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleIncrementGoal(goal)}
                        title="Increment progress by 1"
                        className="px-2 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                      >
                        +1 {goal.unit}
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGoal(goal);
                          setGoalDialogOpen(true);
                        }}
                        className="p-1 h-7 w-7 text-slate-400 hover:text-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingGoalId(goal.id)}
                        className="p-1 h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Daily Habits with Streak Tracking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-semibold text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Daily Habits &amp; Routines ({filteredHabits.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click today&apos;s check-circle to record completion. Duplicate records are strictly prevented.
            </p>
          </div>
        </div>

        {filteredHabits.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No habits configured"
            description="Build positive routines like daily mobility, reading, or deep work closure."
            actionLabel="Add First Habit"
            onAction={() => {
              setEditingHabit(null);
              setHabitDialogOpen(true);
            }}
          />
        ) : (
          <div className="space-y-3">
            {filteredHabits.map((habit) => {
              const isPersonal = habit.workspace === 'personal';
              const streak = calculateHabitStreak(habit.completions, todayStr);
              const completionsSet = new Set(habit.completions);
              const isDoneToday = completionsSet.has(todayStr);

              return (
                <Card
                  key={habit.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isPersonal
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isPersonal ? '🌱 Personal' : '💼 Professional'}
                        </span>

                        <Badge variant="neutral" className="text-[10px]">
                          {habit.frequency}
                        </Badge>

                        {/* Streak Badge */}
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{streak} day streak</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {habit.name}
                      </h3>
                    </div>

                    {/* 7-Day Completion Dots & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        {past7Days.map(({ dateStr, label }) => {
                          const isDone = completionsSet.has(dateStr);
                          const isTodayDate = dateStr === todayStr;

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => handleToggleHabit(habit, dateStr)}
                              title={`${label} (${dateStr}): ${isDone ? 'Completed' : 'Pending'}`}
                              className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-transform hover:scale-105 ${
                                isTodayDate ? 'ring-1 ring-slate-900/40 bg-slate-50' : ''
                              }`}
                            >
                              <span className="text-[10px] font-semibold text-slate-500">
                                {label}
                              </span>
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  isDone
                                    ? isPersonal
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingHabit(habit);
                            setHabitDialogOpen(true);
                          }}
                          className="p-1 h-7 w-7 text-slate-400 hover:text-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingHabitId(habit.id)}
                          className="p-1 h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Goal Dialog */}
      <GoalFormDialog
        isOpen={goalDialogOpen}
        onClose={() => {
          setGoalDialogOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleSaveGoal}
        initialGoal={editingGoal}
        defaultWorkspace={workspace}
      />

      {/* Habit Dialog */}
      <HabitFormDialog
        isOpen={habitDialogOpen}
        onClose={() => {
          setHabitDialogOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleSaveHabit}
        initialHabit={editingHabit}
        defaultWorkspace={workspace}
      />

      {/* Delete Goal Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingGoalId)}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? All measurable progress records for this item will be lost."
        confirmLabel="Delete Goal"
        isDestructive={true}
        isLoading={deleteLoading}
      />

      {/* Delete Habit Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingHabitId)}
        onClose={() => setDeletingHabitId(null)}
        onConfirm={handleDeleteHabit}
        title="Delete Habit"
        description="Are you sure you want to delete this habit and its historical completion streaks?"
        confirmLabel="Delete Habit"
        isDestructive={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};
