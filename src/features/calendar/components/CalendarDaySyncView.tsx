import React, { useState } from 'react';
import { CalendarEvent } from '../schema';
import { TaskItem } from '../../../types/models';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  Clock,
  Video,
  Plus,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

interface CalendarDaySyncViewProps {
  events: CalendarEvent[];
  tasks: TaskItem[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onAddEventAtTime: (time: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00 (7 AM to 9 PM)

export const CalendarDaySyncView: React.FC<CalendarDaySyncViewProps> = ({
  events,
  tasks,
  selectedDate,
  onSelectDate,
  onAddEventAtTime,
  onEditEvent,
}) => {
  // Navigation for day
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const dayEvents = events.filter((e) => e.date === selectedDate);
  const dayTasks = tasks.filter((t) => t.dueDate === selectedDate);

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((e) => {
      const [sh] = e.startTime.split(':').map(Number);
      return sh === hour;
    });
  };

  const formatHourLabel = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const detectMeetingPlatform = (url?: string) => {
    if (!url) return null;
    if (url.includes('meet.google.com')) return { name: 'Google Meet', color: 'bg-emerald-600' };
    if (url.includes('zoom.us')) return { name: 'Zoom', color: 'bg-blue-600' };
    if (url.includes('teams.microsoft.com')) return { name: 'MS Teams', color: 'bg-indigo-600' };
    return { name: 'Join Call', color: 'bg-slate-700' };
  };

  return (
    <div className="space-y-4">
      {/* Date Header Controller */}
      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrevDay} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
            <p className="text-[11px] text-slate-500">
              {dayEvents.length} events · {dayTasks.length} tasks scheduled
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleNextDay} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
          className="text-xs"
        >
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Hourly Timeline (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
          {HOURS.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            const timeStr = `${String(hour).padStart(2, '0')}:00`;

            return (
              <div
                key={hour}
                className="group flex items-start p-2.5 sm:p-3 min-h-[64px] hover:bg-slate-50/60 transition-colors"
              >
                {/* Time Label */}
                <div className="w-20 shrink-0 text-xs font-semibold text-slate-400 font-mono pt-1">
                  {formatHourLabel(hour)}
                </div>

                {/* Event Slot Area */}
                <div className="flex-1 flex flex-col gap-2">
                  {hourEvents.length > 0 ? (
                    hourEvents.map((evt) => {
                      const platform = detectMeetingPlatform(evt.description);
                      const isPersonal = evt.workspace === 'personal';

                      return (
                        <div
                          key={evt.id}
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                            isPersonal
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-blue-50/60 border-blue-200 text-blue-950'
                          }`}
                        >
                          <div
                            onClick={() => onEditEvent(evt)}
                            className="cursor-pointer flex-1 min-w-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate hover:underline">
                                {evt.title}
                              </span>
                              <Badge
                                variant={isPersonal ? 'default' : 'sky'}
                                size="sm"
                                className="text-[10px]"
                              >
                                {evt.category}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                              {evt.startTime} – {evt.endTime}
                            </span>
                          </div>

                          {/* 1-Click Meeting Join */}
                          {evt.description && evt.description.includes('http') && (
                            <a
                              href={
                                evt.description.match(/https?:\/\/[^\s]+/)?.[0] || evt.description
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs shrink-0 self-start sm:self-auto"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{platform?.name || 'Join Call'}</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddEventAtTime(timeStr)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 py-1 transition-opacity cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Block time at {timeStr}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Tasks Sidebar (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ListTodo className="w-4 h-4 text-slate-600" />
              Day Task Queue
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              {dayTasks.filter((t) => t.status === 'completed').length}/{dayTasks.length}
            </span>
          </div>

          {dayTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No tasks due on this date.
            </p>
          ) : (
            <div className="space-y-2">
              {dayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-2 text-xs"
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      t.status === 'completed' ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {t.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">
                      [{t.workspace}] · {t.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
