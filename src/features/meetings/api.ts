import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Meeting, MeetingInvitation, MeetingFormData, ParticipantUser } from './schema';
import { DEMO_UID } from '../tasks/api';

const DEMO_MEETINGS_KEY = 'kurashii_demo_meetings';
const DEMO_INVITATIONS_KEY = 'kurashii_demo_invitations';
const DEMO_MEETINGS_CHANGED = 'kurashii_demo_meetings_changed';

function getDemoSeedMeetings(): { meetings: Meeting[]; invitations: MeetingInvitation[] } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = format(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = format(tomorrow);

  const meetings: Meeting[] = [
    {
      id: 'meet-1',
      organizerId: DEMO_UID,
      organizerName: 'Alex Mercer (You)',
      title: 'Sprint Planning & Backlog Grooming',
      description: 'Discuss incoming feature deliverables and technical dependencies.',
      date: todayStr,
      startTime: '11:00',
      endTime: '12:00',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      participantUids: ['user-sara', 'user-david'],
      status: 'scheduled',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'meet-2',
      organizerId: 'user-sara',
      organizerName: 'Sara Chen',
      title: 'Product Architecture Review',
      description: 'Evaluate Firestore security rules and client-side sync patterns.',
      date: tomorrowStr,
      startTime: '15:00',
      endTime: '16:00',
      meetingUrl: 'https://zoom.us/j/1234567890',
      participantUids: [DEMO_UID],
      status: 'scheduled',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const invitations: MeetingInvitation[] = [
    {
      id: 'inv-1',
      meetingId: 'meet-2',
      organizerId: 'user-sara',
      organizerName: 'Sara Chen',
      inviteeUid: DEMO_UID,
      inviteeName: 'Alex Mercer',
      title: 'Product Architecture Review',
      date: tomorrowStr,
      startTime: '15:00',
      endTime: '16:00',
      meetingUrl: 'https://zoom.us/j/1234567890',
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'inv-2',
      meetingId: 'meet-1',
      organizerId: DEMO_UID,
      organizerName: 'Alex Mercer (You)',
      inviteeUid: 'user-david',
      inviteeName: 'David Kim',
      title: 'Sprint Planning & Backlog Grooming',
      date: todayStr,
      startTime: '11:00',
      endTime: '12:00',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'accepted',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  return { meetings, invitations };
}

function getStoredDemoData(): { meetings: Meeting[]; invitations: MeetingInvitation[] } {
  try {
    const rawM = localStorage.getItem(DEMO_MEETINGS_KEY);
    const rawI = localStorage.getItem(DEMO_INVITATIONS_KEY);
    if (!rawM || !rawI) {
      const seed = getDemoSeedMeetings();
      localStorage.setItem(DEMO_MEETINGS_KEY, JSON.stringify(seed.meetings));
      localStorage.setItem(DEMO_INVITATIONS_KEY, JSON.stringify(seed.invitations));
      return seed;
    }
    return {
      meetings: JSON.parse(rawM),
      invitations: JSON.parse(rawI),
    };
  } catch {
    return getDemoSeedMeetings();
  }
}

function saveDemoData(meetings: Meeting[], invitations: MeetingInvitation[]) {
  try {
    localStorage.setItem(DEMO_MEETINGS_KEY, JSON.stringify(meetings));
    localStorage.setItem(DEMO_INVITATIONS_KEY, JSON.stringify(invitations));
    window.dispatchEvent(new CustomEvent(DEMO_MEETINGS_CHANGED));
  } catch (e) {
    console.error('Error saving demo meetings', e);
  }
}

export async function fetchRegisteredUsers(): Promise<ParticipantUser[]> {
  // Always include standard colleagues for demo or discovery
  const fallbackUsers: ParticipantUser[] = [
    { uid: 'user-sara', displayName: 'Sara Chen', handle: 'sarachen', avatarColor: '#3B82F6' },
    { uid: 'user-david', displayName: 'David Kim', handle: 'davidkim', avatarColor: '#10B981' },
    { uid: 'user-priya', displayName: 'Priya Sharma', handle: 'priyasharma', avatarColor: '#8B5CF6' },
    { uid: 'user-marcus', displayName: 'Marcus Vance', handle: 'marcusv', avatarColor: '#F59E0B' },
  ];

  try {
    const snap = await getDocs(collection(db, 'publicProfiles'));
    const realUsers: ParticipantUser[] = snap.docs.map((d) => ({
      uid: d.id,
      displayName: d.data().displayName || d.data().handle || 'Colleague',
      handle: d.data().handle || 'user',
      avatarColor: d.data().avatarColor || '#3B82F6',
    }));

    if (realUsers.length > 0) {
      // Merge with fallback users so there are always selectable colleagues
      const combined: ParticipantUser[] = [...realUsers];
      for (const fb of fallbackUsers) {
        if (!combined.some((u) => u.uid === fb.uid)) {
          combined.push(fb);
        }
      }
      return combined;
    }
    return fallbackUsers;
  } catch {
    return fallbackUsers;
  }
}

export function subscribeUserMeetings(
  uid: string,
  onUpdate: (meetings: Meeting[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoData().meetings);
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_MEETINGS_CHANGED, handler);
    return () => window.removeEventListener(DEMO_MEETINGS_CHANGED, handler);
  }

  const path = 'meetings';
  const q = query(
    collection(db, 'meetings'),
    where('organizerId', '==', uid)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: Meeting[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Meeting, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export function subscribeUserInvitations(
  uid: string,
  onUpdate: (invitations: MeetingInvitation[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () =>
      onUpdate(getStoredDemoData().invitations.filter((i) => i.inviteeUid === uid || i.organizerId === uid));
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_MEETINGS_CHANGED, handler);
    return () => window.removeEventListener(DEMO_MEETINGS_CHANGED, handler);
  }

  const path = 'meetingInvitations';
  const q = query(
    collection(db, 'meetingInvitations'),
    where('inviteeUid', '==', uid)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: MeetingInvitation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<MeetingInvitation, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export async function createMeeting(
  organizerUid: string,
  organizerName: string,
  data: MeetingFormData,
  allUsers: ParticipantUser[]
): Promise<string> {
  const now = new Date().toISOString();
  if (organizerUid === DEMO_UID) {
    const { meetings, invitations } = getStoredDemoData();
    const newMeetingId = `meet-${Date.now()}`;
    const newMeeting: Meeting = {
      id: newMeetingId,
      organizerId: organizerUid,
      organizerName,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      meetingUrl: data.meetingUrl,
      participantUids: data.participantUids,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    };
    meetings.unshift(newMeeting);

    // Create invitations for each participant
    for (const pUid of data.participantUids) {
      const userObj = allUsers.find((u) => u.uid === pUid);
      const inv: MeetingInvitation = {
        id: `inv-${Date.now()}-${pUid}`,
        meetingId: newMeetingId,
        organizerId: organizerUid,
        organizerName,
        inviteeUid: pUid,
        inviteeName: userObj?.displayName || 'Colleague',
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        meetingUrl: data.meetingUrl,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      invitations.unshift(inv);
    }

    saveDemoData(meetings, invitations);
    return newMeetingId;
  }

  const path = 'meetings';
  try {
    const meetingRef = await addDoc(collection(db, 'meetings'), {
      organizerId: organizerUid,
      organizerName,
      title: data.title,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      meetingUrl: data.meetingUrl || '',
      participantUids: data.participantUids,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    });

    // Create invitations
    for (const pUid of data.participantUids) {
      const userObj = allUsers.find((u) => u.uid === pUid);
      await addDoc(collection(db, 'meetingInvitations'), {
        meetingId: meetingRef.id,
        organizerId: organizerUid,
        organizerName,
        inviteeUid: pUid,
        inviteeName: userObj?.displayName || 'Colleague',
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        meetingUrl: data.meetingUrl || '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      // Also create an in-app notification for the invitee
      await addDoc(collection(db, 'users', pUid, 'notifications'), {
        title: `Meeting Invitation: ${data.title}`,
        message: `${organizerName} invited you to a meeting on ${data.date} at ${data.startTime}.`,
        type: 'invitation',
        read: false,
        link: '/app/work/meetings',
        createdAt: now,
      }).catch(() => {
        // notification write is non-blocking
      });
    }

    return meetingRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateMeeting(
  organizerUid: string,
  meetingId: string,
  data: Partial<MeetingFormData>
): Promise<void> {
  const now = new Date().toISOString();
  if (organizerUid === DEMO_UID) {
    const { meetings, invitations } = getStoredDemoData();
    const idx = meetings.findIndex((m) => m.id === meetingId);
    if (idx !== -1) {
      meetings[idx] = { ...meetings[idx], ...data, updatedAt: now };
      saveDemoData(meetings, invitations);
    }
    return;
  }

  const path = `meetings/${meetingId}`;
  try {
    await updateDoc(doc(db, 'meetings', meetingId), {
      ...data,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function cancelMeeting(organizerUid: string, meetingId: string): Promise<void> {
  const now = new Date().toISOString();
  if (organizerUid === DEMO_UID) {
    const { meetings, invitations } = getStoredDemoData();
    const idx = meetings.findIndex((m) => m.id === meetingId);
    if (idx !== -1) {
      meetings[idx].status = 'cancelled';
      meetings[idx].updatedAt = now;
      saveDemoData(meetings, invitations);
    }
    return;
  }

  const path = `meetings/${meetingId}`;
  try {
    await updateDoc(doc(db, 'meetings', meetingId), {
      status: 'cancelled',
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function respondToInvitation(
  userUid: string,
  userName: string,
  invitationId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  const now = new Date().toISOString();
  if (userUid === DEMO_UID) {
    const { meetings, invitations } = getStoredDemoData();
    const inv = invitations.find((i) => i.id === invitationId);
    if (inv) {
      inv.status = status;
      inv.updatedAt = now;
      saveDemoData(meetings, invitations);
    }
    return;
  }

  const path = `meetingInvitations/${invitationId}`;
  try {
    await updateDoc(doc(db, 'meetingInvitations', invitationId), {
      status,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}
