import React, { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Avatar } from '../../../components/ui/Avatar';
import { ParticipantUser } from '../../meetings/schema';
import { Search, MessageSquare } from 'lucide-react';

interface ChatUserSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: ParticipantUser[];
  currentUserId: string;
  onSelectUser: (user: ParticipantUser) => void;
}

export const ChatUserSearchDialog: React.FC<ChatUserSearchDialogProps> = ({
  isOpen,
  onClose,
  registeredUsers,
  currentUserId,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');

  const candidates = registeredUsers
    .filter((u) => u.uid !== currentUserId)
    .filter((u) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q)
      );
    });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Conversation"
      description="Select a registered colleague to start real-time professional messaging."
      maxWidth="sm"
    >
      <div className="space-y-4 mt-2">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search colleagues by name or @handle..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* User list */}
        <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-slate-100">
          {candidates.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No colleagues found matching &quot;{query}&quot;.
            </p>
          ) : (
            candidates.map((u) => (
              <button
                key={u.uid}
                type="button"
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.displayName} avatarColor={u.avatarColor} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {u.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">@{u.handle}</p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
};
