import React, { useState } from 'react';
import { CalendarEvent } from '../schema';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Calendar as CalendarIcon, Clock, Edit2, Trash2, Tag } from 'lucide-react';
import { formatReadableDate } from '../../../lib/dates';

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => Promise<void>;
  onCreateNew: () => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onEdit,
  onDelete,
  onCreateNew,
}) => {
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Group events by date
  const groupedEvents: { [dateStr: string]: CalendarEvent[] } = {};
  events.forEach((evt) => {
    if (!groupedEvents[evt.date]) {
      groupedEvents[evt.date] = [];
    }
    groupedEvents[evt.date].push(evt);
  });

  const sortedDates = Object.keys(groupedEvents).sort();

  const handleDeleteConfirm = async () => {
    if (!deletingEventId) return;
    setDeleteLoading(true);
    try {
      await onDelete(deletingEventId);
      setDeletingEventId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarIcon}
        title="No scheduled events"
        description="You have no events in this view. Schedule an event to stay in sync with your personal or professional commitments."
        actionLabel="Schedule Event"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {sortedDates.map((dateStr) => {
          const dayEvents = groupedEvents[dateStr].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
          );

          return (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                  {formatReadableDate(dateStr)}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  ({dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'})
                </span>
              </div>

              <div className="space-y-2.5">
                {dayEvents.map((evt) => {
                  const isPersonal = evt.workspace === 'personal';

                  return (
                    <Card
                      key={evt.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPersonal
                          ? 'border-emerald-200/70 bg-gradient-to-r from-emerald-50/20 to-white'
                          : 'border-blue-200/70 bg-gradient-to-r from-blue-50/20 to-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isPersonal
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isPersonal ? '🌱 Personal' : '💼 Professional'}
                            </span>

                            {evt.category && (
                              <Badge variant="neutral" className="text-[11px] gap-1">
                                <Tag className="w-3 h-3" />
                                <span>{evt.category}</span>
                              </Badge>
                            )}

                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {evt.startTime} – {evt.endTime}
                              </span>
                            </span>
                          </div>

                          <h4 className="text-base font-semibold text-slate-900 truncate">
                            {evt.title}
                          </h4>

                          {evt.description && (
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {evt.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(evt)}
                            className="text-slate-600 hover:text-slate-900 gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingEventId(evt.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deletingEventId)}
        onClose={() => setDeletingEventId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Calendar Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete Event"
        isDestructive={true}
        isLoading={deleteLoading}
      />
    </>
  );
};
