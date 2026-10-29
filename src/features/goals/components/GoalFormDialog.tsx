import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { GoalItem, GoalFormData } from '../schema';
import { AlertCircle, Target, Calendar as CalendarIcon, Tag } from 'lucide-react';

interface GoalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  initialGoal?: GoalItem | null;
  defaultWorkspace?: 'personal' | 'professional';
}

export const GoalFormDialog: React.FC<GoalFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialGoal,
  defaultWorkspace = 'personal',
}) => {
  const [workspace, setWorkspace] = useState<'personal' | 'professional'>(defaultWorkspace);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(10);
  const [unit, setUnit] = useState('%');
  const [category, setCategory] = useState('Growth');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialGoal) {
      setWorkspace(initialGoal.workspace);
      setTitle(initialGoal.title);
      setDescription(initialGoal.description || '');
      setTargetDate(initialGoal.targetDate);
      setCurrentProgress(initialGoal.currentProgress);
      setTargetProgress(initialGoal.targetProgress);
      setUnit(initialGoal.unit || '%');
      setCategory(initialGoal.category || 'Growth');
    } else {
      const now = new Date();
      now.setMonth(now.getMonth() + 1);
      const defaultDate = now.toISOString().split('T')[0];

      setWorkspace(defaultWorkspace);
      setTitle('');
      setDescription('');
      setTargetDate(defaultDate);
      setCurrentProgress(0);
      setTargetProgress(100);
      setUnit('%');
      setCategory(defaultWorkspace === 'personal' ? 'Health' : 'Deliverable');
    }
    setError(null);
  }, [initialGoal, isOpen, defaultWorkspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Goal title is required');
      return;
    }
    if (!targetDate) {
      setError('Target date is required');
      return;
    }
    if (targetProgress <= 0) {
      setError('Target progress must be greater than 0');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        workspace,
        title: title.trim(),
        description: description.trim(),
        targetDate,
        currentProgress: Math.max(0, currentProgress),
        targetProgress: Math.max(1, targetProgress),
        unit: unit.trim() || '%',
        category: category.trim() || 'General',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialGoal ? 'Edit Goal' : 'Create Measurable Goal'}
      description="Define tangible goals with measurable target units and milestone tracking."
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
            🌱 Personal Goal
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
            💼 Professional Goal
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Goal Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Read 12 books, Run 100km, Launch v1.0"
            required
            autoFocus
          />
        </div>

        {/* Progress & Target */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Current</label>
            <Input
              type="number"
              min="0"
              value={currentProgress}
              onChange={(e) => setCurrentProgress(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target *</label>
            <Input
              type="number"
              min="1"
              value={targetProgress}
              onChange={(e) => setTargetProgress(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. %, books, km"
              required
            />
          </div>
        </div>

        {/* Target Date & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Date *</span>
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Health, Career, Mindset"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why does this goal matter? What are the key success criteria?"
            rows={2}
          />
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
            {initialGoal ? 'Save Goal' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
