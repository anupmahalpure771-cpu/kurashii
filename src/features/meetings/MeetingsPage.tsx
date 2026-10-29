import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { Meeting, MeetingInvitation, MeetingFormData, ParticipantUser } from './schema';
import {
  subscribeUserMeetings,
  subscribeUserInvitations,
  fetchRegisteredUsers,
  createMeeting,
  updateMeeting,
  cancelMeeting,
  respondToInvitation,
} from './api';
import { MeetingFormDialog } from './components/MeetingFormDialog';
import { MeetingDetailsDialog } from './components/MeetingDetailsDialog';
import { InvitationsPanel } from './components/InvitationsPanel';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Users,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Video,
  Mail,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { formatReadableDate } from '../../lib/dates';

export const MeetingsPage: React.FC = () => {
  const { user, userProfile } = useAuth();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [invitations, setInvitations] = useState<MeetingInvitation[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<ParticipantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'meetings' | 'invitations'>('meetings');

  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    fetchRegisteredUsers().then(setRegisteredUsers);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubMeetings = subscribeUserMeetings(
      user.uid,
      (list) => {
        setMeetings(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubInvitations = subscribeUserInvitations(
      user.uid,
      (list) => {
        setInvitations(list);
      }
    );

    return () => {
      unsubMeetings();
      unsubInvitations();
    };
  }, [user]);

  const pendingInvitesCount = invitations.filter(
    (i) => i.inviteeUid === user?.uid && i.status === 'pending'
  ).length;

  const handleCreateOrUpdate = async (data: MeetingFormData) => {
    if (!user) return;
    const orgName = userProfile?.displayName || 'Colleague';

    if (editingMeeting) {
      await updateMeeting(user.uid, editingMeeting.id, data);
    } else {
      await createMeeting(user.uid, orgName, data, registeredUsers);
    }
    setEditingMeeting(null);
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!user) return;
    await cancelMeeting(user.uid, meetingId);
  };

  const handleRespondInvitation = async (
    invitationId: string,
    status: 'accepted' | 'declined'
  ) => {
    if (!user) return;
    await respondToInvitation(
      user.uid,
      userProfile?.displayName || 'Colleague',
      invitationId,
      status
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Professional Meetings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate syncs, schedule Google Meet / Zoom sessions, and manage team invitations.
          </p>
        </div>

        {/* Action: New Meeting */}
        <Button
          variant="accent"
          onClick={() => {
            setEditingMeeting(null);
            setFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Meeting</span>
        </Button>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 relative ${
            activeTab === 'meetings'
              ? 'text-blue-700 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Scheduled Meetings ({meetings.filter((m) => m.status !== 'cancelled').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 relative ${
            activeTab === 'invitations'
              ? 'text-blue-700 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Invitations</span>
          {pendingInvitesCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingInvitesCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading meetings...</div>
      ) : activeTab === 'invitations' ? (
        <InvitationsPanel
          invitations={invitations}
          currentUserId={user?.uid || ''}
          onRespond={handleRespondInvitation}
        />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No meetings scheduled"
          description="Schedule a team sync, design critique, or one-on-one session with your colleagues."
          actionLabel="Schedule First Meeting"
          onAction={() => {
            setEditingMeeting(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const isCancelled = meeting.status === 'cancelled';

            return (
              <Card
                key={meeting.id}
                hoverEffect={!isCancelled}
                onClick={() => setSelectedMeeting(meeting)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isCancelled
                    ? 'opacity-60 bg-slate-50 border-slate-200'
                    : 'bg-white border-blue-200/80 hover:border-blue-400 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={isCancelled ? 'danger' : 'accent'}
                        className="text-[11px] capitalize"
                      >
                        {meeting.status}
                      </Badge>

                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatReadableDate(meeting.date)}</span>
                      </span>

                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {meeting.startTime} – {meeting.endTime}
                        </span>
                      </span>

                      <span className="text-xs text-slate-400">
                        · {meeting.participantUids.length} participant
                        {meeting.participantUids.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {meeting.title}
                    </h3>

                    {meeting.description && (
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {meeting.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Link */}
                  <div
                    className="flex items-center gap-2 self-end sm:self-center shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {meeting.meetingUrl && !isCancelled && (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join</span>
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                      </a>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMeeting(meeting)}
                      className="text-slate-500 hover:text-slate-800 p-1.5"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Meeting Form Dialog */}
      <MeetingFormDialog
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMeeting(null);
        }}
        onSubmit={handleCreateOrUpdate}
        existingMeetings={meetings}
        registeredUsers={registeredUsers}
        currentUserId={user?.uid || ''}
        initialMeeting={editingMeeting}
      />

      {/* Meeting Details Dialog */}
      <MeetingDetailsDialog
        meeting={selectedMeeting}
        isOpen={Boolean(selectedMeeting)}
        onClose={() => setSelectedMeeting(null)}
        registeredUsers={registeredUsers}
        currentUserId={user?.uid || ''}
        onCancelMeeting={handleCancelMeeting}
      />
    </div>
  );
};
