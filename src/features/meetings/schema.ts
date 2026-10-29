export interface Meeting {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  meetingUrl?: string; // external Zoom / Google Meet URL
  participantUids: string[];
  status: 'scheduled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface MeetingInvitation {
  id: string;
  meetingId: string;
  organizerId: string;
  organizerName: string;
  inviteeUid: string;
  inviteeName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface MeetingFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  participantUids: string[];
}

export interface ParticipantUser {
  uid: string;
  displayName: string;
  handle: string;
  avatarColor?: string;
}

export function detectMeetingConflict(
  existingMeetings: Meeting[],
  newMeeting: { date: string; startTime: string; endTime: string; id?: string }
): Meeting | null {
  for (const m of existingMeetings) {
    if (m.status === 'cancelled') continue;
    if (newMeeting.id && m.id === newMeeting.id) continue;
    if (m.date === newMeeting.date) {
      // Overlap condition: start < m.end && end > m.start
      if (newMeeting.startTime < m.endTime && newMeeting.endTime > m.startTime) {
        return m;
      }
    }
  }
  return null;
}
