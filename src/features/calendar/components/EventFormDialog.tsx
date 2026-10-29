import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { CalendarEvent, EventFormData, validateEventTimes } from '../schema';
import { Clock, Calendar as CalendarIcon, Tag, AlertCircle } from 'lucide-react';

interface EventFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  initialEvent?: Partial<CalendarEvent> | null;
  defaultWorkspace?: 'personal' | 'professional';
}

export const EventFormDialog: React.FC<EventFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialEvent,
  defaultWorkspace = 'personal',
}) => {
  const [workspace, setWorkspace] = useState<'personal' | 'professional'>(defaultWorkspace);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('General');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setWorkspace(initialEvent.workspace || defaultWorkspace);
      setTitle(initialEvent.title || '');
      setDescription(initialEvent.description || '');
      setDate(initialEvent.date || new Date().toISOString().split('T')[0]);
      setStartTime(initialEvent.startTime || '09:00');
      setEndTime(initialEvent.endTime || '10:00');
      setCategory(initialEvent.category || 'General');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setWorkspace(defaultWorkspace);
      setTitle('');
      setDescription('');
      setDate(today);
      setStartTime('09:00');
      setEndTime('10:00');
      setCategory(defaultWorkspace === 'personal' ? 'Health' : 'Meeting');
    }
    setError(null);
  }, [initialEvent, isOpen, defaultWorkspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    const timeErr = validateEventTimes(startTime, endTime);
    if (timeErr) {
      setError(timeErr);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        workspace,
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        category: category.trim() || 'General',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialEvent ? 'Edit Event' : 'Create New Event'}
      description="Schedule an event in your Personal or Professional calendar."
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
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Workspace
          </label>
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
              🌱 Personal
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
              💼 Professional
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Event Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly Strategy Sync or Morning Jog"
            required
            autoFocus
          />
        </div>

        {/* Date & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Date *</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              placeholder="e.g. Work, Health, Focus, Social"
            />
          </div>
        </div>

        {/* Start and End Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Start Time *</span>
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>End Time *</span>
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add agenda, location, or notes..."
            rows={3}
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
            {initialEvent ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
