import { z } from 'zod';

export const PERSONAL_CATEGORIES = [
  'Home',
  'Health',
  'Errands',
  'Learning',
  'Family',
  'Other',
] as const;

export const PROFESSIONAL_CATEGORIES = [
  'Admin',
  'Client',
  'Project',
  'Follow-up',
  'Meeting prep',
  'Other',
] as const;

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(120, 'Title must be 120 characters or fewer'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or fewer')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().min(1, 'Category is required'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .nullable()
    .optional(),
  workspace: z.enum(['personal', 'professional']),
});

export type TaskFormData = z.infer<typeof taskSchema>;
