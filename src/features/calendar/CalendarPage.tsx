import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useWorkspace } from '../../workspace/useWorkspace';
import { useTasks } from '../tasks/hooks';
import { CalendarEvent, EventFormData } from './schema';
import {
  subscribeUserEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from './api';
import { downloadICS } from './icsExport';
import { CalendarMonthView } from './components/CalendarMonthView';
import { CalendarAgendaView } from './components/CalendarAgendaView';
import { CalendarDaySyncView } from './components/CalendarDaySyncView';
import { EventFormDialog } from './components/EventFormDialog';
import { Button } from '../../components/ui/Button';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutList,
  Clock,
  Download,
} from 'lucide-react';
import { addMonths, subMonths, format } from 'date-fns';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { tasks } = useTasks();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'agenda' | 'daysync'>('month');
  const [workspaceFilter, setWorkspaceFilter] = useState<'all' | 'personal' | 'professional'>(
    workspace
  );
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialTimePrefill, setInitialTimePrefill] = useState<string | undefined>(undefined);

  // Sync default filter if workspace prop changed
  useEffect(() => {
    setWorkspaceFilter(workspace);
  }, [workspace]);

  // Subscribe to real-time events
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeUserEvents(
      user.uid,
      (list) => {
        setEvents(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching events:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const filteredEvents = events.filter((e) => {
    if (workspaceFilter === 'all') return true;
    return e.workspace === workspaceFilter;
  });

  const handlePrevMonth = () => setCurrentMonthDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonthDate((prev) => addMonths(prev, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonthDate(now);
    setSelectedDate(now);
  };

  const handleSaveEvent = async (data: EventFormData) => {
    if (!user) return;
    if (editingEvent) {
      await updateCalendarEvent(user.uid, editingEvent.id, data);
    } else {
      await createCalendarEvent(user.uid, data);
    }
    setEditingEvent(null);
    setInitialTimePrefill(undefined);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    await deleteCalendarEvent(user.uid, eventId);
  };

  const handleExportICS = () => {
    downloadICS(filteredEvents, `kurashii-${workspaceFilter}-calendar.ics`);
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-slate-700" />
            <span>Calendar &amp; Events</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Plan your schedule across personal routines and professional meetings.
          </p>
        </div>

        {/* Action: Export .ics & New Event */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportICS}
            title="Download .ics Calendar File for Google Calendar / Apple Calendar"
            className="gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Export .ics</span>
          </Button>

          <Button
            variant="accent"
            onClick={() => {
              setEditingEvent(null);
              setInitialTimePrefill(undefined);
              setDialogOpen(true);
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Controls Bar: Filter by workspace, view switcher, month navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        {/* Workspace Segmented Pill Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setWorkspaceFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              workspaceFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Workspaces
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceFilter('personal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              workspaceFilter === 'personal'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌱 Personal
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceFilter('professional')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              workspaceFilter === 'professional'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💼 Professional
          </button>
        </div>

        {/* View Switcher & Month Navigation */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          {viewMode === 'month' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 h-8 w-8 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold text-slate-800 min-w-[130px] text-center">
                {format(currentMonthDate, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 h-8 w-8 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="text-xs ml-1 h-8 px-2.5"
              >
                Today
              </Button>
            </div>
          )}

          {/* Toggle between Month, Agenda & Day Sync */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              title="Month Grid View"
              className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daysync')}
              title="Day Sync & Hourly Time Blocking"
              className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewMode === 'daysync'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Day Sync</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              title="Agenda List View"
              className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading events...</div>
      ) : viewMode === 'daysync' ? (
        <CalendarDaySyncView
          events={filteredEvents}
          tasks={tasks}
          selectedDate={selectedDateStr}
          onSelectDate={(newDateStr) => setSelectedDate(new Date(newDateStr + 'T00:00:00'))}
          onAddEventAtTime={(timeStr) => {
            setEditingEvent(null);
            setInitialTimePrefill(timeStr);
            setDialogOpen(true);
          }}
          onEditEvent={(evt) => {
            setEditingEvent(evt);
            setDialogOpen(true);
          }}
        />
      ) : viewMode === 'month' ? (
        <div className="space-y-6">
          <CalendarMonthView
            currentDate={currentMonthDate}
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
            }}
            onEventClick={(evt) => {
              setEditingEvent(evt);
              setDialogOpen(true);
            }}
          />

          {/* Mini agenda below month view for the selected day */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="font-heading font-semibold text-sm text-slate-900 mb-3 flex items-center justify-between">
              <span>Events on {format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingEvent(null);
                  setInitialTimePrefill(undefined);
                  setDialogOpen(true);
                }}
                className="text-xs text-slate-600 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add for this day</span>
              </Button>
            </h3>

            {(() => {
              const dayEvts = filteredEvents.filter(
                (e) => e.date === format(selectedDate, 'yyyy-MM-dd')
              );
              if (dayEvts.length === 0) {
                return (
                  <p className="text-xs text-slate-400 italic">No events scheduled on this day.</p>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dayEvts.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setEditingEvent(evt);
                        setDialogOpen(true);
                      }}
                      className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {evt.startTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{evt.category}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <CalendarAgendaView
          events={filteredEvents}
          onEdit={(evt: CalendarEvent) => {
            setEditingEvent(evt);
            setDialogOpen(true);
          }}
          onDelete={handleDeleteEvent}
          onCreateNew={() => {
            setEditingEvent(null);
            setInitialTimePrefill(undefined);
            setDialogOpen(true);
          }}
        />
      )}

      {/* Event Form Dialog */}
      <EventFormDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEvent(null);
          setInitialTimePrefill(undefined);
        }}
        onSubmit={handleSaveEvent}
        initialEvent={
          editingEvent ||
          (initialTimePrefill
            ? {
                id: '',
                workspace,
                title: '',
                description: '',
                date: selectedDateStr,
                startTime: initialTimePrefill,
                endTime: `${String(Number(initialTimePrefill.split(':')[0]) + 1).padStart(2, '0')}:00`,
                category: workspace === 'personal' ? 'Routine' : 'Work',
              }
            : undefined)
        }
        defaultWorkspace={workspace}
      />
    </div>
  );
};
