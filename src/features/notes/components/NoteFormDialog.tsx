import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { NoteItem, NoteFormData } from '../schema';
import { Meeting } from '../../meetings/schema';
import { Tag, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface NoteFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => Promise<void>;
  initialNote?: NoteItem | null;
  defaultWorkspace?: 'personal' | 'professional';
  availableMeetings?: Meeting[];
}

export const NoteFormDialog: React.FC<NoteFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialNote,
  defaultWorkspace = 'personal',
  availableMeetings = [],
}) => {
  const [workspace, setWorkspace] = useState<'personal' | 'professional'>(defaultWorkspace);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [meetingId, setMeetingId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialNote) {
      setWorkspace(initialNote.workspace);
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setCategory(initialNote.category || 'General');
      setMeetingId(initialNote.meetingId || '');
    } else {
      setWorkspace(defaultWorkspace);
      setTitle('');
      setContent('');
      setCategory(defaultWorkspace === 'personal' ? 'Reflection' : 'Meeting Minutes');
      setMeetingId('');
    }
    setError(null);
  }, [initialNote, isOpen, defaultWorkspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Note title is required');
      return;
    }
    if (!content.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        workspace,
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || 'General',
        meetingId: workspace === 'professional' && meetingId ? meetingId : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialNote ? 'Edit Note' : 'Create New Note'}
      description="Capture ideas, research, personal reflections, or professional meeting minutes."
      maxWidth="lg"
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
              🌱 Personal Note
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
              💼 Professional Minutes
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Note Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q4 Strategy Review Minutes or Habit Tracking Thoughts"
            required
            autoFocus
          />
        </div>

        {/* Category & Link to Meeting */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Meeting Minutes, Project, Personal, Idea"
            />
          </div>

          {workspace === 'professional' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Link to Scheduled Meeting</span>
              </label>
              <select
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">(None / General work note)</option>
                {availableMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.date})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Productivity Templates Bar */}
        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Quick Templates</span>
            <span className="text-[11px] text-slate-400">Click to load structure</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                id: 'one_on_one',
                label: '💼 1-on-1 Sync',
                ws: 'professional' as const,
                title: '1-on-1 Sync Agenda & Minutes',
                cat: 'Meeting Minutes',
                body: `## 1-on-1 Sync Agenda & Minutes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Participants:** \n\n### 1. Progress & Recent Wins\n- \n\n### 2. Current Priorities & In-Flight Work\n- \n\n### 3. Roadblocks, Challenges & Support Needed\n- \n\n### 4. Action Items & Commitments\n- [ ] \n- [ ] `,
              },
              {
                id: 'retro',
                label: '💼 Sprint Retrospective',
                ws: 'professional' as const,
                title: 'Sprint Retrospective',
                cat: 'Retrospective',
                body: `## Sprint Retrospective\n\n**Date:** ${new Date().toLocaleDateString()}\n\n### What Went Well (Praise)\n- \n\n### What Could Have Gone Better (Deltas)\n- \n\n### Key Lessons & Action Items\n- [ ] Action item 1\n- [ ] Action item 2`,
              },
              {
                id: 'daily_journal',
                label: '🌱 Daily Reflection',
                ws: 'personal' as const,
                title: `Daily Reflection — ${new Date().toLocaleDateString()}`,
                cat: 'Reflection',
                body: `## Daily Reflection & Gratitude\n\n### 3 Things I Am Grateful For Today\n1. \n2. \n3. \n\n### Highlights & What Energized Me\n- \n\n### Tomorrow's Top Intention\n- `,
              },
              {
                id: 'weekly_review',
                label: '🌱 Weekly Life Review',
                ws: 'personal' as const,
                title: `Weekly Life Review — ${new Date().toLocaleDateString()}`,
                cat: 'Weekly Review',
                body: `## Weekly Life Review\n\n### Highlights & Wins\n- \n\n### Habit & Wellbeing Check\n- Sleep: \n- Exercise: \n- Mindset: \n\n### Top Focus for Next Week\n1. \n2. `,
              },
            ].map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setWorkspace(tpl.ws);
                  setTitle(tpl.title);
                  setCategory(tpl.cat);
                  setContent(tpl.body);
                }}
                className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200/90 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-2xs transition-colors"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Note Content *
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes, decisions, bullet points, and action items..."
            rows={8}
            required
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
            {initialNote ? 'Save Note' : 'Create Note'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
