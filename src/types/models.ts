/**
 * Core model definitions matching the Firestore data model specification.
 */

import type { Timestamp } from 'firebase/firestore';

export type WorkspaceType = 'personal' | 'professional';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  handle: string;
  primaryUse: WorkspaceType;
  lastWorkspace: WorkspaceType;
  timezone: string;
  currency: CurrencyCode;
  defaultMonthlyBudgetMinor?: number;
  theme: 'light' | 'dark' | 'system';
  avatarColor: string;
  onboardingComplete: boolean;
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';
export type TaskStage = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  workspace: WorkspaceType;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: string;
  dueDate: string | null; // 'YYYY-MM-DD' or null
  status: TaskStatus;
  stage?: TaskStage;
  subtasks?: SubtaskItem[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  handle: string;
  avatarColor: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HandleRecord {
  uid: string;
}
