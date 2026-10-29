import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useWorkspace } from '../../workspace/useWorkspace';
import { NoteItem, NoteFormData } from './schema';
import {
  subscribeUserNotes,
  createNote,
  updateNote,
  deleteNote,
} from './api';
import { subscribeUserMeetings } from '../meetings/api';
import { Meeting } from '../meetings/schema';
import { NoteFormDialog } from './components/NoteFormDialog';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatReadableDate } from '../../lib/dates';
import { SearchGroundingModal } from '../searchGrounding/SearchGroundingModal';
import {
  FileText,
  Plus,
  Search,
  Tag,
  Clock,
  Edit2,
  Trash2,
  Link as LinkIcon,
  Globe,
} from 'lucide-react';

export const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchGroundingOpen, setSearchGroundingOpen] = useState(false);

  const [workspaceFilter, setWorkspaceFilter] = useState<'all' | 'personal' | 'professional'>(
    workspace
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setWorkspaceFilter(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubNotes = subscribeUserNotes(
      user.uid,
      (list) => {
        setNotes(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubMeetings = subscribeUserMeetings(user.uid, (list) => {
      setMeetings(list);
    });

    return () => {
      unsubNotes();
      unsubMeetings();
    };
  }, [user]);

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (workspaceFilter !== 'all' && n.workspace !== workspaceFilter) return false;
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchCategory = n.category?.toLowerCase().includes(q);
      return matchTitle || matchContent || matchCategory;
    }
    return true;
  });

  const categories = Array.from(new Set(notes.map((n) => n.category))).filter(Boolean).sort();

  const handleSaveNote = async (data: NoteFormData) => {
    if (!user) return;
    if (editingNote) {
      await updateNote(user.uid, editingNote.id, data);
    } else {
      await createNote(user.uid, data);
    }
    setEditingNote(null);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingNoteId) return;
    setDeleteLoading(true);
    try {
      await deleteNote(user.uid, deletingNoteId);
      setDeletingNoteId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-slate-700" />
            <span>Notes &amp; Meeting Minutes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Capture thoughts, structured documentation, and meeting minutes linked to calendar syncs.
          </p>
        </div>

        {/* Actions: Research with Google & New Note */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setSearchGroundingOpen(true)}
            className="flex items-center gap-1.5 shrink-0 text-xs font-semibold bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 transition-colors shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Research with Google</span>
          </Button>

          <Button
            variant="accent"
            onClick={() => {
              setEditingNote(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Workspace Segmented Controls with Divider Bars and Clean Spacing */}
        <div className="inline-flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setWorkspaceFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              workspaceFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All Workspaces</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold">
              {notes.length}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setWorkspaceFilter('personal')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              workspaceFilter === 'personal'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-200/80 dark:border-emerald-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            <span>Personal</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
              {notes.filter((n) => n.workspace === 'personal').length}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1 shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setWorkspaceFilter('professional')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              workspaceFilter === 'professional'
                ? 'bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-300 shadow-xs border border-blue-200/80 dark:border-blue-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
            <span>Professional</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold">
              {notes.filter((n) => n.workspace === 'professional').length}
            </span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search note titles or content..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading notes...</div>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes found"
          description={
            searchQuery
              ? `No notes matching "${searchQuery}". Try adjusting your search query.`
              : 'Keep your thoughts organized. Create personal reflections or work meeting minutes.'
          }
          actionLabel="Create First Note"
          onAction={() => {
            setEditingNote(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const isPersonal = note.workspace === 'personal';
            const linkedMeeting = meetings.find((m) => m.id === note.meetingId);

            return (
              <Card
                key={note.id}
                hoverEffect
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isPersonal
                    ? 'border-emerald-200/80 bg-white hover:border-emerald-400'
                    : 'border-blue-200/80 bg-white hover:border-blue-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isPersonal
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isPersonal ? '🌱 Personal' : '💼 Professional'}
                    </span>

                    {note.category && (
                      <Badge variant="neutral" className="text-[10px] gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{note.category}</span>
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 tracking-tight line-clamp-2">
                    {note.title}
                  </h3>

                  {linkedMeeting && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200/60">
                      <LinkIcon className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">Meeting: {linkedMeeting.title}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {note.content}
                  </p>
                </div>

                {/* Footer with date & actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated {formatReadableDate(note.updatedAt.split('T')[0])}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNote(note);
                        setFormOpen(true);
                      }}
                      className="p-1 h-7 w-7 text-slate-500 hover:text-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingNoteId(note.id)}
                      className="p-1 h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Note Form Dialog */}
      <NoteFormDialog
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleSaveNote}
        initialNote={editingNote}
        defaultWorkspace={workspace}
        availableMeetings={meetings}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingNoteId)}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete Note"
        isDestructive={true}
        isLoading={deleteLoading}
      />

      <SearchGroundingModal
        isOpen={searchGroundingOpen}
        onClose={() => setSearchGroundingOpen(false)}
        context="Notes and research documentation knowledge base"
      />
    </div>
  );
};
