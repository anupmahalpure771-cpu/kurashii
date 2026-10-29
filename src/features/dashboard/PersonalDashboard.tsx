import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useTasks } from '../tasks/hooks';
import { TaskCard } from '../tasks/components/TaskCard';
import { TaskFormDialog } from '../tasks/components/TaskFormDialog';
import { EventFormDialog } from '../calendar/components/EventFormDialog';
import { ExpenseFormDialog } from '../expenses/components/ExpenseFormDialog';
import { GoalFormDialog } from '../goals/components/GoalFormDialog';
import { CalendarEvent } from '../calendar/schema';
import { subscribeUserEvents, createCalendarEvent } from '../calendar/api';
import { ExpenseTransaction, MonthlyBudget } from '../expenses/schema';
import { subscribeUserExpenses, subscribeMonthlyBudgets, createExpense } from '../expenses/api';
import { GoalItem, HabitItem, calculateHabitStreak } from '../goals/schema';
import {
  subscribeUserGoals,
  subscribeUserHabits,
  createGoal,
  toggleHabitCompletion,
} from '../goals/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { getTimeOfDayGreeting, formatReadableDate } from '../../lib/dates';
import { formatMoney } from '../../lib/money';
import { CurrencyCode } from '../../types/models';
import {
  CheckSquare,
  Plus,
  AlertCircle,
  Calendar,
  ArrowRight,
  Wallet,
  Target,
  Sparkles,
  Clock,
  TrendingDown,
  Check,
  Flame,
} from 'lucide-react';

export const PersonalDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { tasks, loading: tasksLoading, stats, todayStr } = useTasks('personal');
  const currency: CurrencyCode = userProfile?.currency || 'INR';

  // Subscribed state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, MonthlyBudget>>({});
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);

  // Dialog triggers
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);

  const firstName = userProfile?.displayName?.split(' ')[0] || 'Friend';
  const greeting = getTimeOfDayGreeting(userProfile?.timezone);
  const formattedToday = formatReadableDate(todayStr);

  const currentMonthStr = todayStr.substring(0, 7);

  useEffect(() => {
    if (!user) return;

    const unsubEvents = subscribeUserEvents(user.uid, (list) => {
      setEvents(list.filter((e) => e.workspace === 'personal'));
    });

    const unsubExpenses = subscribeUserExpenses(user.uid, (list) => {
      setExpenses(list);
    });

    const unsubBudgets = subscribeMonthlyBudgets(user.uid, (map) => {
      setBudgets(map);
    });

    const unsubGoals = subscribeUserGoals(user.uid, (list) => {
      setGoals(list.filter((g) => g.workspace === 'personal'));
    });

    const unsubHabits = subscribeUserHabits(user.uid, (list) => {
      setHabits(list.filter((h) => h.workspace === 'personal'));
    });

    return () => {
      unsubEvents();
      unsubExpenses();
      unsubBudgets();
      unsubGoals();
      unsubHabits();
    };
  }, [user]);

  // Financial calculations for current month
  const monthTransactions = expenses.filter((t) => t.date.startsWith(currentMonthStr));
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amountMinor, 0);
  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountMinor, 0);
  const netBalance = totalIncome - totalExpenses;
  const currentBudgetMinor =
    budgets[currentMonthStr]?.budgetMinor ?? userProfile?.defaultMonthlyBudgetMinor ?? 0;
  const remainingBudgetMinor = currentBudgetMinor - totalExpenses;

  // Upcoming personal events (events on or after today)
  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 3);

  // Active goals
  const activeGoals = goals.slice(0, 2);

  const handleToggleHabit = async (habit: HabitItem) => {
    if (!user) return;
    await toggleHabitCompletion(user.uid, habit.id, todayStr, habit.completions);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personal Space · Today is <span className="font-semibold text-slate-700">{formattedToday}</span>
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEventFormOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>New Event</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpenseFormOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add Expense</span>
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() => setTaskFormOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Tasks */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Tasks
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-slate-900 tabular-nums">
              {tasksLoading ? '—' : stats.pendingCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.completedCount} completed · {stats.overdueCount} overdue
            </p>
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Upcoming Events
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-slate-900 tabular-nums">
              {events.filter((e) => e.date >= todayStr).length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Scheduled personal events</p>
          </div>
        </Card>

        {/* Monthly Expenses */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Month Expenses
            </span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-red-600 tabular-nums">
              {formatMoney(totalExpenses, currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Net balance: {formatMoney(netBalance, currency)}
            </p>
          </div>
        </Card>

        {/* Budget Status */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Budget Remaining
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-slate-900 tabular-nums">
              {formatMoney(remainingBudgetMinor, currency)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Limit: {currentBudgetMinor > 0 ? formatMoney(currentBudgetMinor, currency) : 'Not set'}
            </p>
          </div>
        </Card>
      </div>

      {/* Row 2: Today & Overdue Tasks (Left) + Upcoming Calendar & Habits (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Focus Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-lg text-slate-900">
                  Today &amp; Overdue Tasks
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Focus items due today or pending past their due date
                </p>
              </div>
              <Link
                to="/app/personal/tasks"
                className="text-xs font-semibold text-[#047857] hover:underline flex items-center gap-1"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tasksLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
              </div>
            ) : stats.todayAndOverdue.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks due today"
                description="You have no overdue or pending tasks scheduled for today. Enjoy your balance!"
                actionLabel="Schedule a task"
                onAction={() => setTaskFormOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {stats.todayAndOverdue.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    todayStr={todayStr}
                    onEdit={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Goals Progress Mini Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Personal Goals Progress</span>
                </h3>
              </div>
              <Link
                to="/app/personal/goals"
                className="text-xs font-semibold text-[#047857] hover:underline flex items-center gap-1"
              >
                <span>View all goals</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {activeGoals.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No personal goals created yet. Click &quot;New Goal&quot; to set targets!
              </p>
            ) : (
              <div className="space-y-3">
                {activeGoals.map((g) => {
                  const pct = Math.min(100, Math.round((g.currentProgress / g.targetProgress) * 100));
                  return (
                    <div key={g.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{g.title}</span>
                        <span className="text-slate-600 font-bold">
                          {g.currentProgress} / {g.targetProgress} {g.unit} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Events & Habit Check-ins */}
        <div className="space-y-6">
          {/* Upcoming Personal Events */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Upcoming Events</span>
              </h3>
              <Link
                to="/app/personal/calendar"
                className="text-xs font-semibold text-[#047857] hover:underline flex items-center gap-1"
              >
                <span>Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No upcoming personal events.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-start justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 truncate">{evt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {formatReadableDate(evt.date)} · {evt.startTime} - {evt.endTime}
                        </span>
                      </p>
                    </div>
                    {evt.category && (
                      <Badge variant="neutral" className="text-[10px] shrink-0">
                        {evt.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Habits Check-off */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Today&apos;s Habits</span>
              </h3>
              <Link
                to="/app/personal/goals"
                className="text-xs font-semibold text-[#047857] hover:underline flex items-center gap-1"
              >
                <span>Habits</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {habits.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No habits created yet.</p>
            ) : (
              <div className="space-y-2">
                {habits.map((h) => {
                  const isDone = h.completions.includes(todayStr);
                  const streak = calculateHabitStreak(h.completions, todayStr);

                  return (
                    <div
                      key={h.id}
                      onClick={() => handleToggleHabit(h)}
                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : null}
                        </div>
                        <span
                          className={`text-xs truncate ${
                            isDone ? 'line-through text-slate-400' : 'font-medium text-slate-800'
                          }`}
                        >
                          {h.name}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{streak}d</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskFormDialog
        isOpen={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        workspace="personal"
      />

      {/* Event Modal */}
      <EventFormDialog
        isOpen={eventFormOpen}
        onClose={() => setEventFormOpen(false)}
        onSubmit={async (data) => {
          if (user) await createCalendarEvent(user.uid, data);
        }}
        defaultWorkspace="personal"
      />

      {/* Expense Modal */}
      <ExpenseFormDialog
        isOpen={expenseFormOpen}
        onClose={() => setExpenseFormOpen(false)}
        onSubmit={async (data) => {
          if (user) await createExpense(user.uid, data);
        }}
        currency={currency}
      />

      {/* Goal Modal */}
      <GoalFormDialog
        isOpen={goalFormOpen}
        onClose={() => setGoalFormOpen(false)}
        onSubmit={async (data) => {
          if (user) await createGoal(user.uid, data);
        }}
        defaultWorkspace="personal"
      />
    </div>
  );
};
