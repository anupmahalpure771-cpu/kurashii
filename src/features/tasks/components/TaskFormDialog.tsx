import React, { useState, useEffect } from 'react';
import { TaskItem, TaskPriority, WorkspaceType } from '../../../types/models';
import { PERSONAL_CATEGORIES, PROFESSIONAL_CATEGORIES } from '../schema';
import { createTask, updateTask } from '../api';
import { useAuth } from '../../../auth/AuthProvider';
import { useToast } from '../../../components/ui/Toast';
import { Dialog } from '../../../components/ui/Dialog';
import { Sheet } from '../../../components/ui/Sheet';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface TaskFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceType;
  initialTask?: TaskItem | null;
}

export const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  isOpen,
  onClose,
  workspace,
  initialTask,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const isEditing = Boolean(initialTask);
  const categories = workspace === 'personal' ? PERSONAL_CATEGORIES : PROFESSIONAL_CATEGORIES;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<string>(categories[0]);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setCategory(initialTask.category || categories[0]);
      setDueDate(initialTask.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory(categories[0]);
      setDueDate('');
    }
    setErrors({});
  }, [initialTask, categories, isOpen]);

  const validate = () => {
    const errs: { title?: string; description?: string } = {};
    if (!title.trim()) {
      errs.title = 'Title is required (1–120 characters)';
    } else if (title.trim().length > 120) {
      errs.title = 'Title must be 120 characters or fewer';
    }
    if (description && description.length > 2000) {
      errs.description = 'Description must be 2000 characters or fewer';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && initialTask) {
        await updateTask(user.uid, initialTask.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          category,
          dueDate: dueDate || null,
        });
        toast.success('Task updated successfully');
      } else {
        await createTask(user.uid, {
          workspace,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          category,
          dueDate: dueDate || null,
          status: 'pending',
        });
        toast.success('Task created successfully');
      }
      onClose();
    } catch (err) {
      toast.error('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Task Title *"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Review Q3 quarterly report"
        error={errors.title}
        maxLength={120}
      />

      <Textarea
        label="Description (optional)"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add details, links, or notes..."
        error={errors.description}
        maxLength={2000}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categoryOptions}
        />

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={priorityOptions}
        />
      </div>

      <Input
        label="Due Date (optional)"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <div className="flex items-center justify-end gap-3 pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
          {isEditing ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );

  const titleText = isEditing ? 'Edit Task' : `New ${workspace === 'personal' ? 'Personal' : 'Work'} Task`;
  const descText = isEditing ? 'Update task details and deadlines' : 'Add a task to stay organized and productive';

  if (isMobile) {
    return (
      <Sheet isOpen={isOpen} onClose={onClose} title={titleText} description={descText} position="bottom">
        {formContent}
      </Sheet>
    );
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={titleText} description={descText} maxWidth="md">
      {formContent}
    </Dialog>
  );
};
