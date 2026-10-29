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
import { NoteItem, NoteFormData } from './schema';
import { DEMO_UID } from '../tasks/api';

const DEMO_NOTES_KEY = 'kurashii_demo_notes';
const DEMO_NOTES_CHANGED = 'kurashii_demo_notes_changed';

function getDemoSeedNotes(): NoteItem[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return [
    {
      id: 'note-1',
      workspace: 'professional',
      title: 'Q4 Product Roadmap Alignment Minutes',
      content:
        'Discussed key milestones for Kurashii:\n1. Integrate real-time calendar and conflict detection.\n2. Ensure zero demo leaks with strict Firestore security rules.\n3. Complete mobile responsive verification.\n\nNext steps: Schedule design review on Friday.',
      category: 'Meeting Minutes',
      meetingId: 'meet-1',
      createdAt: yesterday.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'note-2',
      workspace: 'professional',
      title: 'Frontend State Architecture & Offline Persistence',
      content:
        'Architecture guidelines:\n- All Firestore subscribers must unsubscribe cleanly on unmount.\n- Demo mode provides instant deterministic feedback.\n- Use ISO 8601 timestamps and integer minor currency amounts.',
      category: 'Engineering',
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: 'note-3',
      workspace: 'personal',
      title: 'Mindfulness & Morning Habit Reflections',
      content:
        'Morning routine test notes:\n- 20 mins light mobility + 10 mins breathwork sets a calm baseline.\n- Keep phone in airplane mode until 8:30 AM.\n- Hydrate with warm lemon water first thing.',
      category: 'Wellness',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'note-4',
      workspace: 'personal',
      title: 'Weekend Reading Recommendations',
      content:
        'Books to explore this month:\n- Atomic Habits by James Clear\n- Essentialism by Greg McKeown\n- Deep Work by Cal Newport',
      category: 'Reading',
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
  ];
}

function getStoredDemoNotes(): NoteItem[] {
  try {
    const raw = localStorage.getItem(DEMO_NOTES_KEY);
    if (!raw) {
      const seed = getDemoSeedNotes();
      localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return getDemoSeedNotes();
  }
}

function saveDemoNotes(notes: NoteItem[]) {
  try {
    localStorage.setItem(DEMO_NOTES_KEY, JSON.stringify(notes));
    window.dispatchEvent(new CustomEvent(DEMO_NOTES_CHANGED));
  } catch (e) {
    console.error('Error saving demo notes', e);
  }
}

export function subscribeUserNotes(
  uid: string,
  onUpdate: (notes: NoteItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoNotes());
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_NOTES_CHANGED, handler);
    return () => window.removeEventListener(DEMO_NOTES_CHANGED, handler);
  }

  const path = `users/${uid}/notes`;
  const q = query(collection(db, 'users', uid, 'notes'), orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: NoteItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<NoteItem, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export async function createNote(uid: string, data: NoteFormData): Promise<string> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const notes = getStoredDemoNotes();
    const newId = `note-${Date.now()}`;
    const newNote: NoteItem = {
      id: newId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    notes.unshift(newNote);
    saveDemoNotes(notes);
    return newId;
  }

  const path = `users/${uid}/notes`;
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'notes'), {
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

export async function updateNote(
  uid: string,
  noteId: string,
  data: Partial<NoteFormData>
): Promise<void> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const notes = getStoredDemoNotes();
    const idx = notes.findIndex((n) => n.id === noteId);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], ...data, updatedAt: now };
      saveDemoNotes(notes);
    }
    return;
  }

  const path = `users/${uid}/notes/${noteId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notes', noteId), {
      ...data,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  if (uid === DEMO_UID) {
    const notes = getStoredDemoNotes().filter((n) => n.id !== noteId);
    saveDemoNotes(notes);
    return;
  }

  const path = `users/${uid}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}
