import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useWorkspace } from '../../workspace/useWorkspace';
import { TaskItem, WorkspaceType } from '../../types/models';
import { subscribeWorkspaceTasks } from './api';
import { getTodayDateString, isOverdue, isDueToday, isDueThisWeek } from '../../lib/dates';
import { sortTasks } from './taskUtils';

export interface TaskStats {
  total: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  todayAndOverdue: TaskItem[];
}

interface TasksContextType {
  tasks: TaskItem[];
  rawTasks: TaskItem[];
  loading: boolean;
  error: string | null;
  stats: TaskStats;
  todayStr: string;
  workspace: WorkspaceType;
}

const TasksContext = createContext<TasksContextType | null>(null);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { workspace } = useWorkspace();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    return getTodayDateString(userProfile?.timezone);
  }, [userProfile?.timezone]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Exactly one listener for the active workspace
    const unsubscribe = subscribeWorkspaceTasks(
      user.uid,
      workspace,
      (loadedTasks) => {
        setTasks(loadedTasks);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tasks in TasksProvider:', err);
        setError('Failed to load tasks. Please try again.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, workspace]);

  const sortedTasks = useMemo(() => {
    return sortTasks(tasks, todayStr);
  }, [tasks, todayStr]);

  const stats = useMemo<TaskStats>(() => {
    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    const overdueCount = pendingTasks.filter((t) => isOverdue(t.dueDate, todayStr)).length;
    const dueTodayCount = pendingTasks.filter((t) => isDueToday(t.dueDate, todayStr)).length;
    const dueThisWeekCount = pendingTasks.filter((t) => isDueThisWeek(t.dueDate, todayStr)).length;

    const todayAndOverdue = pendingTasks.filter(
      (t) => isOverdue(t.dueDate, todayStr) || isDueToday(t.dueDate, todayStr)
    );

    return {
      total: tasks.length,
      pendingCount: pendingTasks.length,
      completedCount: completedTasks.length,
      overdueCount,
      dueTodayCount,
      dueThisWeekCount,
      todayAndOverdue: todayAndOverdue.slice(0, 5),
    };
  }, [tasks, todayStr]);

  const value = useMemo(
    () => ({
      tasks: sortedTasks,
      rawTasks: tasks,
      loading,
      error,
      stats,
      todayStr,
      workspace,
    }),
    [sortedTasks, tasks, loading, error, stats, todayStr, workspace]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export function useTasksContext(): TasksContextType {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasksContext must be used within a TasksProvider');
  }
  return context;
}
