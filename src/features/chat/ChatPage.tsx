import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { ConversationItem, ChatMessage } from './schema';
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  startOrGetConversation,
  sendMessage,
} from './api';
import { fetchRegisteredUsers } from '../meetings/api';
import { ParticipantUser } from '../meetings/schema';
import { ChatUserSearchDialog } from './components/ChatUserSearchDialog';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { formatReadableDate } from '../../lib/dates';
import {
  MessageSquare,
  Plus,
  Send,
  Search,
  ChevronLeft,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user, userProfile } = useAuth();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<ParticipantUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputText, setInputText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchRegisteredUsers().then(setRegisteredUsers);
  }, []);

  // Subscribe to user conversations
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsub = subscribeUserConversations(
      user.uid,
      (list) => {
        setConversations(list);
        setLoading(false);
        // Default select first conversation if none selected
        if (!activeConvId && list.length > 0) {
          setActiveConvId(list[0].id);
        }
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user, activeConvId]);

  // Subscribe to active conversation messages
  useEffect(() => {
    if (!activeConvId || !user) {
      setMessages([]);
      return;
    }

    const unsub = subscribeConversationMessages(
      activeConvId,
      user.uid,
      (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    );

    return () => unsub();
  }, [activeConvId, user]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // Find other participant in active conversation
  const otherUid = activeConversation?.participantUids.find((uid) => uid !== user?.uid);
  const otherUser = registeredUsers.find((u) => u.uid === otherUid);
  const otherName =
    otherUser?.displayName ||
    (otherUid && activeConversation?.participantNames?.[otherUid]) ||
    'Colleague';

  const handleStartChatWith = async (selectedUser: ParticipantUser) => {
    if (!user) return;
    const myName = userProfile?.displayName || 'Colleague';
    const convId = await startOrGetConversation(
      user.uid,
      myName,
      selectedUser.uid,
      selectedUser.displayName
    );
    setActiveConvId(convId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || !user) return;

    setSendLoading(true);
    setSendError(null);
    try {
      await sendMessage(
        activeConvId,
        user.uid,
        userProfile?.displayName || 'Colleague',
        inputText.trim()
      );
      setInputText('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <span>Professional Chat</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time direct messaging with teammates in your professional workspace.
          </p>
        </div>

        <Button
          variant="accent"
          size="sm"
          onClick={() => setSearchDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Main Chat Layout Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex h-[650px]">
        {/* Left: Conversations Sidebar (hidden on mobile if active conversation is viewed) */}
        <div
          className={`w-full sm:w-80 border-r border-slate-200 flex flex-col shrink-0 ${
            activeConvId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Conversations ({conversations.length})
            </span>
            <button
              type="button"
              onClick={() => setSearchDialogOpen(true)}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Find</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active conversations. Click &quot;New Chat&quot; to message a colleague.
              </div>
            ) : (
              conversations.map((conv) => {
                const partnerUid = conv.participantUids.find((id) => id !== user?.uid);
                const partnerObj = registeredUsers.find((u) => u.uid === partnerUid);
                const partnerName =
                  partnerObj?.displayName ||
                  (partnerUid && conv.participantNames?.[partnerUid]) ||
                  'Colleague';

                const isSelected = conv.id === activeConvId;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <Avatar
                      name={partnerName}
                      avatarColor={partnerObj?.avatarColor}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {partnerName}
                        </p>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatReadableDate(conv.lastMessageAt.split('T')[0])}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage || 'Start conversation...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-slate-50/30 ${
            !activeConvId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-3.5 px-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConvId(null)}
                    className="sm:hidden p-1 text-slate-500 hover:text-slate-800"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <Avatar
                    name={otherName}
                    avatarColor={otherUser?.avatarColor}
                    size="sm"
                  />

                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900 truncate">
                      {otherName}
                    </h2>
                    <p className="text-[10px] text-slate-400 truncate">
                      {otherUser?.handle ? `@${otherUser.handle}` : 'Professional contact'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                    <span>No messages yet. Send a greeting to start chatting!</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderUid === user?.uid;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-2xs ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>

                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error warning if any */}
              {sendError && (
                <div className="px-4 py-2 bg-red-50 text-red-600 text-xs flex items-center gap-1.5 border-t border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}

              {/* Input bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${otherName}...`}
                  className="flex-1 h-10 px-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  isLoading={sendLoading}
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-xl shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">No Conversation Selected</p>
              <p className="mt-1">
                Select an existing conversation on the left, or click &quot;New Chat&quot; to start messaging a teammate.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Search Dialog */}
      <ChatUserSearchDialog
        isOpen={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        registeredUsers={registeredUsers}
        currentUserId={user?.uid || ''}
        onSelectUser={handleStartChatWith}
      />
    </div>
  );
};
