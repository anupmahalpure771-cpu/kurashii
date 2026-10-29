import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { AppNotification } from './schema';
import { DEMO_UID } from '../tasks/api';

const DEMO_NOTIFS_KEY = 'kurashii_demo_notifications';
const DEMO_NOTIFS_CHANGED = 'kurashii_demo_notifications_changed';

function getDemoSeedNotifications(): AppNotification[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [
    {
      id: 'notif-1',
      title: 'New Meeting Invitation',
      message: 'Sara Chen invited you to "Product Architecture Review" on ' + format(tomorrow) + ' at 15:00.',
      type: 'invitation',
      read: false,
      link: '/app/work/meetings',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'notif-2',
      title: 'Invitation Accepted',
      message: 'David Kim accepted your invitation to "Sprint Planning & Backlog Grooming".',
      type: 'invitation',
      read: false,
      link: '/app/work/meetings',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'notif-3',
      title: 'Welcome to Kurashii',
      message: 'Your personal life and professional world are now in sync. Explore tasks, calendar, and expenses.',
      type: 'system',
      read: true,
      link: '/app/personal',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
}

function getStoredDemoNotifs(): AppNotification[] {
  try {
    const raw = localStorage.getItem(DEMO_NOTIFS_KEY);
    if (!raw) {
      const seed = getDemoSeedNotifications();
      localStorage.setItem(DEMO_NOTIFS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return getDemoSeedNotifications();
  }
}

function saveDemoNotifs(notifs: AppNotification[]) {
  try {
    localStorage.setItem(DEMO_NOTIFS_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent(DEMO_NOTIFS_CHANGED));
  } catch (e) {
    console.error('Error saving demo notifs', e);
  }
}

export function subscribeUserNotifications(
  uid: string,
  onUpdate: (notifications: AppNotification[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoNotifs());
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_NOTIFS_CHANGED, handler);
    return () => window.removeEventListener(DEMO_NOTIFS_CHANGED, handler);
  }

  const path = `users/${uid}/notifications`;
  const q = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: AppNotification[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AppNotification, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export async function setNotificationRead(
  uid: string,
  notifId: string,
  read: boolean
): Promise<void> {
  if (uid === DEMO_UID) {
    const notifs = getStoredDemoNotifs();
    const idx = notifs.findIndex((n) => n.id === notifId);
    if (idx !== -1) {
      notifs[idx].read = read;
      saveDemoNotifs(notifs);
    }
    return;
  }

  const path = `users/${uid}/notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteNotification(uid: string, notifId: string): Promise<void> {
  if (uid === DEMO_UID) {
    const notifs = getStoredDemoNotifs().filter((n) => n.id !== notifId);
    saveDemoNotifs(notifs);
    return;
  }

  const path = `users/${uid}/notifications/${notifId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notifications', notifId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function markAllNotificationsRead(uid: string, notifs: AppNotification[]): Promise<void> {
  if (uid === DEMO_UID) {
    const all = getStoredDemoNotifs().map((n) => ({ ...n, read: true }));
    saveDemoNotifs(all);
    return;
  }

  for (const n of notifs.filter((x) => !x.read)) {
    try {
      await updateDoc(doc(db, 'users', uid, 'notifications', n.id), { read: true });
    } catch {
      // non-blocking
    }
  }
}
