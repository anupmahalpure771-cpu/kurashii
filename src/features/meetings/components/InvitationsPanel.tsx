import React from 'react';
import { MeetingInvitation } from '../schema';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Mail, Check, X, Clock, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { formatReadableDate } from '../../../lib/dates';

interface InvitationsPanelProps {
  invitations: MeetingInvitation[];
  currentUserId: string;
  onRespond: (invitationId: string, status: 'accepted' | 'declined') => Promise<void>;
}

export const InvitationsPanel: React.FC<InvitationsPanelProps> = ({
  invitations,
  currentUserId,
  onRespond,
}) => {
  const incoming = invitations.filter((i) => i.inviteeUid === currentUserId);

  if (incoming.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No meeting invitations"
        description="You have no pending or past invitations from colleagues."
      />
    );
  }

  return (
    <div className="space-y-3">
      {incoming.map((inv) => {
        const isPending = inv.status === 'pending';
        const isAccepted = inv.status === 'accepted';
        const isDeclined = inv.status === 'declined';

        return (
          <Card
            key={inv.id}
            className={`p-4 rounded-xl border transition-all ${
              isPending
                ? 'border-blue-300 bg-blue-50/30'
                : 'border-slate-200/90 bg-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={
                      isAccepted ? 'success' : isDeclined ? 'danger' : 'accent'
                    }
                    className="capitalize text-xs"
                  >
                    {inv.status}
                  </Badge>

                  <span className="text-xs text-slate-500 font-medium">
                    Invited by <strong className="text-slate-800">{inv.organizerName}</strong>
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 truncate">
                  {inv.title}
                </h4>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatReadableDate(inv.date)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {inv.startTime} – {inv.endTime}
                    </span>
                  </span>
                  {inv.meetingUrl && (
                    <a
                      href={inv.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Join link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {isPending ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onRespond(inv.id, 'accepted')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 py-1.5 px-3"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRespond(inv.id, 'declined')}
                      className="text-red-600 hover:bg-red-50 text-xs gap-1.5 py-1.5 px-3"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </Button>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-500 italic">
                    Response recorded ({inv.status})
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
