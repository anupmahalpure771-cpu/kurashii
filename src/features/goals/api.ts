import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { GoalItem, GoalFormData, HabitItem, HabitFormData } from './schema';
import { DEMO_UID } from '../tasks/api';

const DEMO_GOALS_KEY = 'kurashii_demo_goals';
const DEMO_HABITS_KEY = 'kurashii_demo_habits';
const DEMO_GOALS_CHANGED = 'kurashii_demo_goals_changed';

function getDemoSeedData(): { goals: GoalItem[]; habits: HabitItem[] } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = format(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = format(yesterday);

  const dayBefore = new Date(now);
  dayBefore.setDate(dayBefore.getDate() - 2);
  const dayBeforeStr = format(dayBefore);

  const targetDate = new Date(now);
  targetDate.setMonth(targetDate.getMonth() + 2);
  const targetDateStr = format(targetDate);

  const goals: GoalItem[] = [
    // Personal Goals (5 goals)
    {
      id: 'goal-p1',
      workspace: 'personal',
      title: '10,000 Daily Steps Consistency',
      description: 'Hit 10k steps daily to stay active and boost baseline cardiovascular vitality.',
      targetDate: targetDateStr,
      currentProgress: 22,
      targetProgress: 30,
      unit: 'days',
      category: 'Fitness',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-p2',
      workspace: 'personal',
      title: 'Read 12 Books This Year',
      description: 'Expand mental models with literature on philosophy, systems, and design.',
      targetDate: targetDateStr,
      currentProgress: 8,
      targetProgress: 12,
      unit: 'books',
      category: 'Reading',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-p3',
      workspace: 'personal',
      title: 'Run 100 Kilometers',
      description: 'Build aerobic endurance with consistent morning 5K and weekend runs.',
      targetDate: targetDateStr,
      currentProgress: 68,
      targetProgress: 100,
      unit: 'km',
      category: 'Health',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-p4',
      workspace: 'personal',
      title: 'Daily 2.5L Hydration Target',
      description: 'Track optimal water intake across 30 active days to enhance focus and energy.',
      targetDate: targetDateStr,
      currentProgress: 25,
      targetProgress: 30,
      unit: 'days',
      category: 'Wellness',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-p5',
      workspace: 'personal',
      title: 'Cook 20 Home-Made Nutrition Meals',
      description: 'Prepare wholesome plant-forward home recipes to maintain balanced nutrition.',
      targetDate: targetDateStr,
      currentProgress: 14,
      targetProgress: 20,
      unit: 'meals',
      category: 'Nutrition',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },

    // Professional Goals (5 goals)
    {
      id: 'goal-w1',
      workspace: 'professional',
      title: 'Conduct 20 Customer Discovery Interviews',
      description: 'Deep-dive user feedback sessions to inform product backlog and roadmap.',
      targetDate: targetDateStr,
      currentProgress: 16,
      targetProgress: 20,
      unit: 'interviews',
      category: 'Product',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-w2',
      workspace: 'professional',
      title: 'Ship Kurashii Full-Stack Platform',
      description: 'Deliver core milestone modules and verified end-to-end user journeys.',
      targetDate: targetDateStr,
      currentProgress: 6,
      targetProgress: 7,
      unit: 'modules',
      category: 'Engineering',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-w3',
      workspace: 'professional',
      title: 'Publish 8 Technical Architecture Articles',
      description: 'Document engineering learnings on distributed state and UI architecture.',
      targetDate: targetDateStr,
      currentProgress: 5,
      targetProgress: 8,
      unit: 'articles',
      category: 'Content',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-w4',
      workspace: 'professional',
      title: 'Achieve 99.9% Uptime SLA for Microservices',
      description: 'Harden reliability, observability, and scale-to-zero server resilience.',
      targetDate: targetDateStr,
      currentProgress: 99.8,
      targetProgress: 99.9,
      unit: '%',
      category: 'DevOps',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'goal-w5',
      workspace: 'professional',
      title: 'Complete Cloud Solutions Architect Certification',
      description: 'Finish all 24 study roadmap modules and practice exams.',
      targetDate: targetDateStr,
      currentProgress: 18,
      targetProgress: 24,
      unit: 'modules',
      category: 'Learning',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const habits: HabitItem[] = [
    {
      id: 'habit-1',
      workspace: 'personal',
      name: '10k Daily Steps & Evening Walk',
      frequency: 'daily',
      category: 'Health',
      completions: [dayBeforeStr, yesterdayStr, todayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'habit-2',
      workspace: 'personal',
      name: 'Morning Hydration & 20-min Mobility',
      frequency: 'daily',
      category: 'Health',
      completions: [dayBeforeStr, yesterdayStr, todayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'habit-3',
      workspace: 'personal',
      name: 'Evening Screen-Free Wind Down',
      frequency: 'daily',
      category: 'Wellness',
      completions: [dayBeforeStr, yesterdayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'habit-4',
      workspace: 'personal',
      name: '15-Minute Mindful Meditation',
      frequency: 'daily',
      category: 'Wellness',
      completions: [yesterdayStr, todayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'habit-5',
      workspace: 'professional',
      name: 'Review Daily Sprint Priorities & Standup',
      frequency: 'weekdays',
      category: 'Focus',
      completions: [yesterdayStr, todayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'habit-6',
      workspace: 'professional',
      name: 'Deep Work Block (No Slack/Email 90m)',
      frequency: 'weekdays',
      category: 'Focus',
      completions: [dayBeforeStr, yesterdayStr, todayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'habit-7',
      workspace: 'professional',
      name: 'Zero Inbox & Daily Closure',
      frequency: 'weekdays',
      category: 'Organization',
      completions: [dayBeforeStr, yesterdayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'habit-8',
      workspace: 'professional',
      name: 'Weekly Code Review & Tech Debt Grooming',
      frequency: 'weekly',
      category: 'Engineering',
      completions: [yesterdayStr],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  return { goals, habits };
}

function getStoredDemoData(): { goals: GoalItem[]; habits: HabitItem[] } {
  try {
    const rawG = localStorage.getItem(DEMO_GOALS_KEY);
    const rawH = localStorage.getItem(DEMO_HABITS_KEY);
    if (!rawG || !rawH) {
      const seed = getDemoSeedData();
      localStorage.setItem(DEMO_GOALS_KEY, JSON.stringify(seed.goals));
      localStorage.setItem(DEMO_HABITS_KEY, JSON.stringify(seed.habits));
      return seed;
    }
    const parsedGoals: GoalItem[] = JSON.parse(rawG);
    const parsedHabits: HabitItem[] = JSON.parse(rawH);

    // If existing stored data had fewer than 5 goals or missing step goal, reseed to ensure full experience
    if (parsedGoals.length < 8 || !parsedGoals.some((g) => g.title.includes('Steps'))) {
      const seed = getDemoSeedData();
      localStorage.setItem(DEMO_GOALS_KEY, JSON.stringify(seed.goals));
      localStorage.setItem(DEMO_HABITS_KEY, JSON.stringify(seed.habits));
      return seed;
    }

    return {
      goals: parsedGoals,
      habits: parsedHabits,
    };
  } catch {
    return getDemoSeedData();
  }
}

function saveDemoData(goals: GoalItem[], habits: HabitItem[]) {
  try {
    localStorage.setItem(DEMO_GOALS_KEY, JSON.stringify(goals));
    localStorage.setItem(DEMO_HABITS_KEY, JSON.stringify(habits));
    window.dispatchEvent(new CustomEvent(DEMO_GOALS_CHANGED));
  } catch (e) {
    console.error('Error saving demo goals', e);
  }
}

export function subscribeUserGoals(
  uid: string,
  onUpdate: (goals: GoalItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoData().goals);
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_GOALS_CHANGED, handler);
    return () => window.removeEventListener(DEMO_GOALS_CHANGED, handler);
  }

  const path = `users/${uid}/goals`;
  const q = query(collection(db, 'users', uid, 'goals'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: GoalItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<GoalItem, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export function subscribeUserHabits(
  uid: string,
  onUpdate: (habits: HabitItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoData().habits);
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_GOALS_CHANGED, handler);
    return () => window.removeEventListener(DEMO_GOALS_CHANGED, handler);
  }

  const path = `users/${uid}/habits`;
  const q = query(collection(db, 'users', uid, 'habits'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: HabitItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HabitItem, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export async function createGoal(uid: string, data: GoalFormData): Promise<string> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const { goals, habits } = getStoredDemoData();
    const newId = `goal-${Date.now()}`;
    const newGoal: GoalItem = {
      id: newId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    goals.unshift(newGoal);
    saveDemoData(goals, habits);
    return newId;
  }

  const path = `users/${uid}/goals`;
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'goals'), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateGoal(
  uid: string,
  goalId: string,
  data: Partial<GoalFormData>
): Promise<void> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const { goals, habits } = getStoredDemoData();
    const idx = goals.findIndex((g) => g.id === goalId);
    if (idx !== -1) {
      goals[idx] = { ...goals[idx], ...data, updatedAt: now };
      saveDemoData(goals, habits);
    }
    return;
  }

  const path = `users/${uid}/goals/${goalId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'goals', goalId), {
      ...data,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteGoal(uid: string, goalId: string): Promise<void> {
  if (uid === DEMO_UID) {
    const { goals, habits } = getStoredDemoData();
    const filtered = goals.filter((g) => g.id !== goalId);
    saveDemoData(filtered, habits);
    return;
  }

  const path = `users/${uid}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'goals', goalId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function createHabit(uid: string, data: HabitFormData): Promise<string> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const { goals, habits } = getStoredDemoData();
    const newId = `habit-${Date.now()}`;
    const newHabit: HabitItem = {
      id: newId,
      ...data,
      completions: [],
      createdAt: now,
      updatedAt: now,
    };
    habits.unshift(newHabit);
    saveDemoData(goals, habits);
    return newId;
  }

  const path = `users/${uid}/habits`;
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'habits'), {
      ...data,
      completions: [],
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateHabit(
  uid: string,
  habitId: string,
  data: Partial<HabitFormData>
): Promise<void> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const { goals, habits } = getStoredDemoData();
    const idx = habits.findIndex((h) => h.id === habitId);
    if (idx !== -1) {
      habits[idx] = { ...habits[idx], ...data, updatedAt: now };
      saveDemoData(goals, habits);
    }
    return;
  }

  const path = `users/${uid}/habits/${habitId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'habits', habitId), {
      ...data,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  if (uid === DEMO_UID) {
    const { goals, habits } = getStoredDemoData();
    const filtered = habits.filter((h) => h.id !== habitId);
    saveDemoData(goals, filtered);
    return;
  }

  const path = `users/${uid}/habits/${habitId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'habits', habitId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function toggleHabitCompletion(
  uid: string,
  habitId: string,
  dateStr: string,
  existingCompletions: string[]
): Promise<void> {
  const now = new Date().toISOString();
  const set = new Set(existingCompletions);
  if (set.has(dateStr)) {
    set.delete(dateStr);
  } else {
    set.add(dateStr);
  }
  const newCompletions = Array.from(set).sort();

  if (uid === DEMO_UID) {
    const { goals, habits } = getStoredDemoData();
    const idx = habits.findIndex((h) => h.id === habitId);
    if (idx !== -1) {
      habits[idx].completions = newCompletions;
      habits[idx].updatedAt = now;
      saveDemoData(goals, habits);
    }
    return;
  }

  const path = `users/${uid}/habits/${habitId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'habits', habitId), {
      completions: newCompletions,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}
