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
import { CalendarEvent, EventFormData } from './schema';
import { DEMO_UID } from '../tasks/api';

const DEMO_EVENTS_KEY = 'kurashii_demo_events';
const DEMO_EVENTS_CHANGED = 'kurashii_demo_events_changed';

function getDemoSeedEvents(): CalendarEvent[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = format(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = format(tomorrow);

  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 3);
  const dayAfterStr = format(dayAfter);

  return [
    {
      id: 'evt-1',
      workspace: 'personal',
      title: 'Morning Yoga & Breathwork',
      description: '30-minute mindfulness and mobility routine',
      date: todayStr,
      startTime: '07:30',
      endTime: '08:15',
      category: 'Health',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'evt-2',
      workspace: 'professional',
      title: 'Product Roadmap Alignment',
      description: 'Review Q4 deliverables and sprint velocity with engineering leads',
      date: todayStr,
      startTime: '10:00',
      endTime: '11:00',
      category: 'Meeting',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'evt-3',
      workspace: 'personal',
      title: 'Farmers Market & Grocery Run',
      description: 'Pick up organic produce and pantry staples',
      date: tomorrowStr,
      startTime: '09:00',
      endTime: '10:30',
      category: 'Errands',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'evt-4',
      workspace: 'professional',
      title: 'Design Critique Session',
      description: 'Figma review of the new Kurashii calendar and scheduler screens',
      date: dayAfterStr,
      startTime: '14:00',
      endTime: '15:00',
      category: 'Design',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

function getStoredDemoEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(DEMO_EVENTS_KEY);
    if (!raw) {
      const seed = getDemoSeedEvents();
      localStorage.setItem(DEMO_EVENTS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return getDemoSeedEvents();
  }
}

function saveDemoEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem(DEMO_EVENTS_KEY, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent(DEMO_EVENTS_CHANGED));
  } catch (e) {
    console.error('Error saving demo events', e);
  }
}

export function subscribeUserEvents(
  uid: string,
  onUpdate: (events: CalendarEvent[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoEvents());
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_EVENTS_CHANGED, handler);
    return () => window.removeEventListener(DEMO_EVENTS_CHANGED, handler);
  }

  const path = `users/${uid}/events`;
  const q = query(collection(db, 'users', uid, 'events'), orderBy('date', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: CalendarEvent[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CalendarEvent, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export async function createCalendarEvent(uid: string, data: EventFormData): Promise<string> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const events = getStoredDemoEvents();
    const newId = `evt-${Date.now()}`;
    const newEvent: CalendarEvent = {
      id: newId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    events.push(newEvent);
    saveDemoEvents(events);
    return newId;
  }

  const path = `users/${uid}/events`;
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'events'), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateCalendarEvent(
  uid: string,
  eventId: string,
  data: Partial<EventFormData>
): Promise<void> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const events = getStoredDemoEvents();
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...data, updatedAt: now };
      saveDemoEvents(events);
    }
    return;
  }

  const path = `users/${uid}/events/${eventId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'events', eventId), {
      ...data,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteCalendarEvent(uid: string, eventId: string): Promise<void> {
  if (uid === DEMO_UID) {
    const events = getStoredDemoEvents().filter((e) => e.id !== eventId);
    saveDemoEvents(events);
    return;
  }

  const path = `users/${uid}/events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'events', eventId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}
