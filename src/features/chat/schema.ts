export interface ConversationItem {
  id: string;
  participantUids: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export function generateConversationId(uid1: string, uid2: string): string {
  // Deterministic 1-to-1 conversation ID sorted alphabetically
  const sorted = [uid1, uid2].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}
