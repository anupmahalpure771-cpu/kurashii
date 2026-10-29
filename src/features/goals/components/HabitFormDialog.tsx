import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { HabitItem, HabitFormData } from '../schema';
import { AlertCircle, Tag, Repeat } from 'lucide-react';

interface HabitFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HabitFormData) => Promise<void>;
  initialHabit?: HabitItem | null;
  defaultWorkspace?: 'personal' | 'professional';
}

export const HabitFormDialog: React.FC<HabitFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialHabit,
  defaultWorkspace = 'personal',
}) => {
  const [workspace, setWorkspace] = useState<'personal' | 'professional'>(defaultWorkspace);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekly'>('daily');
  const [category, setCategory] = useState('Wellness');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialHabit) {
      setWorkspace(initialHabit.workspace);
      setName(initialHabit.name);
      setFrequency(initialHabit.frequency);
      setCategory(initialHabit.category || 'Wellness');
    } else {
      setWorkspace(defaultWorkspace);
      setName('');
      setFrequency('daily');
      setCategory(defaultWorkspace === 'personal' ? 'Health' : 'Focus');
    }
    setError(null);
  }, [initialHabit, isOpen, defaultWorkspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        workspace,
        name: name.trim(),
        frequency,
        category: category.trim() || 'General',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialHabit ? 'Edit Habit' : 'Build New Habit'}
      description="Build consistent personal routines and work habits with daily check-ins."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Workspace Segmented Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setWorkspace('personal')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              workspace === 'personal'
                ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌱 Personal Habit
          </button>
          <button
            type="button"
            onClick={() => setWorkspace('professional')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              workspace === 'professional'
                ? 'bg-white text-blue-800 shadow-sm border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💼 Professional Habit
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Habit Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 20-min Mobility & Stretch, Morning Standup Prep..."
            required
            autoFocus
          />
        </div>

        {/* Frequency & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Frequency</span>
            </label>
            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as 'daily' | 'weekdays' | 'weekly')
              }
              className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays only (Mon - Fri)</option>
              <option value="weekly">Once per week</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Health, Focus, Mindfulness"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            isLoading={loading}
            className={
              workspace === 'personal'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          >
            {initialHabit ? 'Save Changes' : 'Start Habit'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
