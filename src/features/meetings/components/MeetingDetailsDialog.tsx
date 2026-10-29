import React from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { Meeting, ParticipantUser } from '../schema';
import { formatReadableDate } from '../../../lib/dates';
import { Clock, Calendar as CalendarIcon, Video, Users, ExternalLink, XCircle } from 'lucide-react';

interface MeetingDetailsDialogProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: ParticipantUser[];
  currentUserId: string;
  onCancelMeeting: (meetingId: string) => Promise<void>;
}

export const MeetingDetailsDialog: React.FC<MeetingDetailsDialogProps> = ({
  meeting,
  isOpen,
  onClose,
  registeredUsers,
  currentUserId,
  onCancelMeeting,
}) => {
  if (!meeting) return null;

  const isOrganizer = meeting.organizerId === currentUserId;
  const isCancelled = meeting.status === 'cancelled';

  const participants = meeting.participantUids.map((uid) => {
    const found = registeredUsers.find((u) => u.uid === uid);
    return {
      uid,
      displayName: found?.displayName || 'Colleague',
      handle: found?.handle || 'user',
      avatarColor: found?.avatarColor || '#3B82F6',
    };
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={meeting.title}
      description={`Organized by ${meeting.organizerName}`}
      maxWidth="md"
    >
      <div className="space-y-5 mt-2">
        {/* Status indicator if cancelled */}
        {isCancelled && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>This meeting has been cancelled by the organizer.</span>
          </div>
        )}

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Date</p>
              <p className="text-xs font-semibold text-slate-900">
                {formatReadableDate(meeting.date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Time</p>
              <p className="text-xs font-semibold text-slate-900">
                {meeting.startTime} – {meeting.endTime}
              </p>
            </div>
          </div>
        </div>

        {/* External Video Meeting Link */}
        {meeting.meetingUrl ? (
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Video className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs text-blue-900 font-medium truncate">
                {meeting.meetingUrl}
              </span>
            </div>
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
            >
              <span>Join Call</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No external video URL attached.</p>
        )}

        {/* Description / Agenda */}
        {meeting.description && (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Agenda &amp; Notes
            </h4>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {meeting.description}
            </div>
          </div>
        )}

        {/* Participants */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Participants ({participants.length})</span>
          </h4>
          {participants.length === 0 ? (
            <p className="text-xs text-slate-400">No external participants invited.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {participants.map((p) => (
                <div
                  key={p.uid}
                  className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <Avatar name={p.displayName} avatarColor={p.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {p.displayName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">@{p.handle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {isOrganizer && !isCancelled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await onCancelMeeting(meeting.id);
                  onClose();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
              >
                Cancel Meeting
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
