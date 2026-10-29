import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useTasks } from '../tasks/hooks';
import { TaskCard } from '../tasks/components/TaskCard';
import { TaskFormDialog } from '../tasks/components/TaskFormDialog';
import { MeetingFormDialog } from '../meetings/components/MeetingFormDialog';
import { EventFormDialog } from '../calendar/components/EventFormDialog';
import { NoteFormDialog } from '../notes/components/NoteFormDialog';
import { Meeting, MeetingInvitation, ParticipantUser } from '../meetings/schema';
import {
  subscribeUserMeetings,
  subscribeUserInvitations,
  fetchRegisteredUsers,
  createMeeting,
  respondToInvitation,
} from '../meetings/api';
import { CalendarEvent } from '../calendar/schema';
import { subscribeUserEvents, createCalendarEvent } from '../calendar/api';
import { ConversationItem } from '../chat/schema';
import { subscribeUserConversations } from '../chat/api';
import { createNote } from '../notes/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { getTimeOfDayGreeting, formatReadableDate } from '../../lib/dates';
import {
  Briefcase,
  Plus,
  AlertCircle,
  Calendar,
  ArrowRight,
  CheckSquare,
  Users,
  MessageSquare,
  Clock,
  Video,
  ExternalLink,
  Check,
  X,
  FileText,
} from 'lucide-react';

export const WorkDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { tasks, loading: tasksLoading, stats, todayStr } = useTasks('professional');

  // Subscribed states
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [invitations, setInvitations] = useState<MeetingInvitation[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<ParticipantUser[]>([]);

  // Dialog triggers
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);

  const firstName = userProfile?.displayName?.split(' ')[0] || 'Colleague';
  const greeting = getTimeOfDayGreeting(userProfile?.timezone);
  const formattedToday = formatReadableDate(todayStr);

  useEffect(() => {
    fetchRegisteredUsers().then(setRegisteredUsers);
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubMeetings = subscribeUserMeetings(user.uid, (list) => {
      setMeetings(list);
    });

    const unsubInvitations = subscribeUserInvitations(user.uid, (list) => {
      setInvitations(list);
    });

    const unsubEvents = subscribeUserEvents(user.uid, (list) => {
      setEvents(list.filter((e) => e.workspace === 'professional'));
    });

    const unsubConversations = subscribeUserConversations(user.uid, (list) => {
      setConversations(list);
    });

    return () => {
      unsubMeetings();
      unsubInvitations();
      unsubEvents();
      unsubConversations();
    };
  }, [user]);

  // Upcoming scheduled meetings
  const upcomingMeetings = meetings
    .filter((m) => m.status === 'scheduled' && m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 3);

  // Pending incoming invitations
  const pendingInvitations = invitations.filter(
    (i) => i.inviteeUid === user?.uid && i.status === 'pending'
  );

  // Recent conversations (top 3)
  const recentConversations = conversations.slice(0, 3);

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
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Professional Space · Today is <span className="font-semibold text-slate-700">{formattedToday}</span>
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMeetingFormOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Schedule Meeting</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setNoteFormOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Meeting Note</span>
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() => setTaskFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Work Task</span>
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Work Tasks */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Work Tasks
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-slate-900 tabular-nums">
              {tasksLoading ? '—' : stats.pendingCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.completedCount} completed · {stats.overdueCount} overdue
            </p>
          </div>
        </Card>

        {/* Upcoming Meetings */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Scheduled Meetings
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-slate-900 tabular-nums">
              {upcomingMeetings.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Upcoming team syncs</p>
          </div>
        </Card>

        {/* Pending Invitations */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Incoming Invites
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-slate-900 tabular-nums">
              {pendingInvitations.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {pendingInvitations.length > 0 ? 'Awaiting your RSVP' : 'No pending invites'}
            </p>
          </div>
        </Card>

        {/* Active Conversations */}
        <Card hoverEffect className="border-[#E2E8F0] p-4 rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Chats
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold font-heading text-slate-900 tabular-nums">
              {conversations.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct message channels</p>
          </div>
        </Card>
      </div>

      {/* Row 2: Work Items Due (Left) + Upcoming Meetings & Invitations & Chats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Work items due today */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-lg text-slate-900">
                  Priority Work Items Due
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tasks requiring immediate delivery or follow-up
                </p>
              </div>
              <Link
                to="/app/work/tasks"
                className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tasksLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
              </div>
            ) : stats.todayAndOverdue.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="All clear for today"
                description="You have no overdue or pending work tasks scheduled for today."
                actionLabel="Add work task"
                onAction={() => setTaskFormOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {stats.todayAndOverdue.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    todayStr={todayStr}
                    onEdit={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Incoming Invitations Card if any */}
          {pendingInvitations.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-base text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Incoming Meeting Invitations ({pendingInvitations.length})</span>
                </h3>
                <Link
                  to="/app/work/meetings"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-2.5">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{inv.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {inv.organizerName} · {formatReadableDate(inv.date)} · {inv.startTime} - {inv.endTime}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRespondInvitation(inv.id, 'accepted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRespondInvitation(inv.id, 'declined')}
                        className="text-red-600 hover:bg-red-50 text-xs h-7 px-3 gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Decline</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Upcoming Meetings & Recent Chats */}
        <div className="space-y-6">
          {/* Upcoming Meetings Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Upcoming Meetings</span>
              </h3>
              <Link
                to="/app/work/meetings"
                className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1"
              >
                <span>All Meetings</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingMeetings.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No upcoming meetings scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-blue-100 bg-blue-50/30 flex items-start justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 truncate">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {formatReadableDate(m.date)} · {m.startTime} - {m.endTime}
                        </span>
                      </p>
                    </div>
                    {m.meetingUrl && (
                      <a
                        href={m.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1 shrink-0"
                        title="Open video call"
                      >
                        <Video className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Conversations Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Recent Chats</span>
              </h3>
              <Link
                to="/app/work/chat"
                className="text-xs font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1"
              >
                <span>Chat</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentConversations.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No active chats yet.</p>
            ) : (
              <div className="space-y-2">
                {recentConversations.map((c) => {
                  const partnerUid = c.participantUids.find((id) => id !== user?.uid);
                  const partnerObj = registeredUsers.find((u) => u.uid === partnerUid);
                  const partnerName =
                    partnerObj?.displayName ||
                    (partnerUid && c.participantNames?.[partnerUid]) ||
                    'Colleague';

                  return (
                    <Link
                      key={c.id}
                      to="/app/work/chat"
                      className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 hover:bg-slate-100 transition-colors"
                    >
                      <Avatar
                        name={partnerName}
                        avatarColor={partnerObj?.avatarColor}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {partnerName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {c.lastMessage}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskFormDialog
        isOpen={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        workspace="professional"
      />

      {/* Meeting Modal */}
      <MeetingFormDialog
        isOpen={meetingFormOpen}
        onClose={() => setMeetingFormOpen(false)}
        onSubmit={async (data) => {
          if (user) {
            await createMeeting(
              user.uid,
              userProfile?.displayName || 'Colleague',
              data,
              registeredUsers
            );
          }
        }}
        existingMeetings={meetings}
        registeredUsers={registeredUsers}
        currentUserId={user?.uid || ''}
      />

      {/* Event Modal */}
      <EventFormDialog
        isOpen={eventFormOpen}
        onClose={() => setEventFormOpen(false)}
        onSubmit={async (data) => {
          if (user) await createCalendarEvent(user.uid, data);
        }}
        defaultWorkspace="professional"
      />

      {/* Note Modal */}
      <NoteFormDialog
        isOpen={noteFormOpen}
        onClose={() => setNoteFormOpen(false)}
        onSubmit={async (data) => {
          if (user) await createNote(user.uid, data);
        }}
        defaultWorkspace="professional"
        availableMeetings={meetings}
      />
    </div>
  );
};
