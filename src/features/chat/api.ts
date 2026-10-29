import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { ConversationItem, ChatMessage, generateConversationId } from './schema';
import { DEMO_UID } from '../tasks/api';

const DEMO_CONVS_KEY = 'kurashii_demo_convs';
const DEMO_MSGS_KEY = 'kurashii_demo_msgs';
const DEMO_CHAT_CHANGED = 'kurashii_demo_chat_changed';

function getDemoSeedChat(): {
  conversations: ConversationItem[];
  messages: Record<string, ChatMessage[]>;
} {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const convId = generateConversationId(DEMO_UID, 'user-sara');

  const conversations: ConversationItem[] = [
    {
      id: convId,
      participantUids: [DEMO_UID, 'user-sara'],
      participantNames: {
        [DEMO_UID]: 'Alex Mercer',
        'user-sara': 'Sara Chen',
      },
      lastMessage: 'Sounds great! I will share the updated roadmap notes before our sync.',
      lastMessageAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
  ];

  const messages: Record<string, ChatMessage[]> = {
    [convId]: [
      {
        id: 'msg-1',
        conversationId: convId,
        senderUid: 'user-sara',
        senderName: 'Sara Chen',
        content: 'Hi Alex! Did you have a chance to review the Q4 architecture proposal?',
        createdAt: new Date(yesterday.getTime() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: convId,
        senderUid: DEMO_UID,
        senderName: 'Alex Mercer',
        content: 'Yes! The separation of Personal and Professional spaces looks clean and intuitive.',
        createdAt: new Date(yesterday.getTime() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: 'msg-3',
        conversationId: convId,
        senderUid: 'user-sara',
        senderName: 'Sara Chen',
        content: 'Sounds great! I will share the updated roadmap notes before our sync.',
        createdAt: yesterday.toISOString(),
      },
    ],
  };

  return { conversations, messages };
}

function getStoredDemoData(): {
  conversations: ConversationItem[];
  messages: Record<string, ChatMessage[]>;
} {
  try {
    const rawC = localStorage.getItem(DEMO_CONVS_KEY);
    const rawM = localStorage.getItem(DEMO_MSGS_KEY);
    if (!rawC || !rawM) {
      const seed = getDemoSeedChat();
      localStorage.setItem(DEMO_CONVS_KEY, JSON.stringify(seed.conversations));
      localStorage.setItem(DEMO_MSGS_KEY, JSON.stringify(seed.messages));
      return seed;
    }
    return {
      conversations: JSON.parse(rawC),
      messages: JSON.parse(rawM),
    };
  } catch {
    return getDemoSeedChat();
  }
}

function saveDemoData(
  conversations: ConversationItem[],
  messages: Record<string, ChatMessage[]>
) {
  try {
    localStorage.setItem(DEMO_CONVS_KEY, JSON.stringify(conversations));
    localStorage.setItem(DEMO_MSGS_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent(DEMO_CHAT_CHANGED));
  } catch (e) {
    console.error('Error saving demo chat', e);
  }
}

export function subscribeUserConversations(
  uid: string,
  onUpdate: (conversations: ConversationItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () =>
      onUpdate(
        getStoredDemoData().conversations.filter((c) => c.participantUids.includes(uid))
      );
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_CHAT_CHANGED, handler);
    return () => window.removeEventListener(DEMO_CHAT_CHANGED, handler);
  }

  const path = 'conversations';
  const q = query(
    collection(db, 'conversations'),
    where('participantUids', 'array-contains', uid)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: ConversationItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ConversationItem, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export function subscribeConversationMessages(
  convId: string,
  uid: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoData().messages[convId] || []);
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_CHAT_CHANGED, handler);
    return () => window.removeEventListener(DEMO_CHAT_CHANGED, handler);
  }

  const path = `conversations/${convId}/messages`;
  const q = query(collection(db, 'conversations', convId, 'messages'), orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export async function startOrGetConversation(
  myUid: string,
  myName: string,
  otherUid: string,
  otherName: string
): Promise<string> {
  const convId = generateConversationId(myUid, otherUid);
  const now = new Date().toISOString();

  if (myUid === DEMO_UID) {
    const { conversations, messages } = getStoredDemoData();
    let existing = conversations.find((c) => c.id === convId);
    if (!existing) {
      existing = {
        id: convId,
        participantUids: [myUid, otherUid],
        participantNames: {
          [myUid]: myName,
          [otherUid]: otherName,
        },
        lastMessage: 'Conversation started',
        lastMessageAt: now,
        updatedAt: now,
      };
      conversations.unshift(existing);
      if (!messages[convId]) {
        messages[convId] = [];
      }
      saveDemoData(conversations, messages);
    }
    return convId;
  }

  const path = `conversations/${convId}`;
  try {
    await setDoc(
      doc(db, 'conversations', convId),
      {
        participantUids: [myUid, otherUid],
        participantNames: {
          [myUid]: myName,
          [otherUid]: otherName,
        },
        updatedAt: now,
      },
      { merge: true }
    );
    return convId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function sendMessage(
  convId: string,
  senderUid: string,
  senderName: string,
  content: string
): Promise<void> {
  const now = new Date().toISOString();

  if (senderUid === DEMO_UID) {
    const { conversations, messages } = getStoredDemoData();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderUid,
      senderName,
      content,
      createdAt: now,
    };
    if (!messages[convId]) {
      messages[convId] = [];
    }
    messages[convId].push(newMsg);

    const cIdx = conversations.findIndex((c) => c.id === convId);
    if (cIdx !== -1) {
      conversations[cIdx].lastMessage = content;
      conversations[cIdx].lastMessageAt = now;
      conversations[cIdx].updatedAt = now;
    }
    saveDemoData(conversations, messages);
    return;
  }

  const msgPath = `conversations/${convId}/messages`;
  try {
    await addDoc(collection(db, 'conversations', convId, 'messages'), {
      conversationId: convId,
      senderUid,
      senderName,
      content,
      createdAt: now,
    });

    await updateDoc(doc(db, 'conversations', convId), {
      lastMessage: content,
      lastMessageAt: now,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, msgPath);
    throw err;
  }
}
