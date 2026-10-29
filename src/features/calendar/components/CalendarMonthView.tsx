import React from 'react';
import { CalendarEvent } from '../schema';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  events,
  selectedDate,
  onSelectDate,
  onEventClick,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Week day header */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center py-2.5">
        {weekHeaders.map((head) => (
          <div key={head} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {head}
          </div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
        {days.map((d, index) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayEvents = events.filter((e) => e.date === dateStr);
          const inCurrentMonth = isSameMonth(d, currentDate);
          const isSelected = isSameDay(d, selectedDate);
          const isCurrentDay = isToday(d);

          return (
            <div
              key={dateStr + index}
              onClick={() => onSelectDate(d)}
              className={`p-2 min-h-[96px] sm:min-h-[110px] flex flex-col justify-between transition-colors cursor-pointer ${
                !inCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white text-slate-800'
              } ${isSelected ? 'ring-2 ring-inset ring-slate-900 bg-slate-50/70' : 'hover:bg-slate-50/80'}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isCurrentDay
                      ? 'bg-slate-900 text-white font-bold'
                      : isSelected
                      ? 'bg-slate-200 text-slate-900'
                      : ''
                  }`}
                >
                  {format(d, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                  </span>
                )}
              </div>

              {/* Event pills on the day */}
              <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-[72px]">
                {dayEvents.slice(0, 3).map((evt) => {
                  const isPersonal = evt.workspace === 'personal';
                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(evt);
                      }}
                      title={`${evt.startTime} - ${evt.endTime}: ${evt.title}`}
                      className={`text-[11px] px-1.5 py-0.5 rounded truncate font-medium border cursor-pointer transition-transform hover:scale-[1.02] ${
                        isPersonal
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
                          : 'bg-blue-50 text-blue-800 border-blue-200/80 hover:bg-blue-100'
                      }`}
                    >
                      <span className="font-semibold mr-1">{evt.startTime}</span>
                      {evt.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-slate-500 font-medium pl-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
