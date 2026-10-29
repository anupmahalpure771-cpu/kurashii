import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { AppNotification } from './schema';
import {
  subscribeUserNotifications,
  setNotificationRead,
  deleteNotification,
  markAllNotificationsRead,
} from './api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatReadableDate } from '../../lib/dates';
import {
  Bell,
  CheckCheck,
  Trash2,
  Mail,
  Users,
  MessageSquare,
  Info,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsub = subscribeUserNotifications(
      user.uid,
      (list) => {
        setNotifications(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user]);

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggleRead = async (notif: AppNotification) => {
    if (!user) return;
    await setNotificationRead(user.uid, notif.id, !notif.read);
  };

  const handleDelete = async (notifId: string) => {
    if (!user) return;
    await deleteNotification(user.uid, notifId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'invitation':
        return <Mail className="w-5 h-5 text-blue-600" />;
      case 'meeting':
        return <Users className="w-5 h-5 text-emerald-600" />;
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-violet-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-slate-700" />
            <span>In-App Notifications</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay informed on scheduled invitations, meeting updates, and critical system events.
          </p>
        </div>

        {unreadCount > 0 && user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllNotificationsRead(user.uid, notifications)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading notifications...</div>
      ) : filteredNotifs.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description={
            filter === 'unread'
              ? "You're all caught up! No unread notifications."
              : 'You have no notifications in your inbox.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 rounded-xl border transition-all ${
                notif.read
                  ? 'bg-white border-slate-200/90'
                  : 'bg-blue-50/40 border-blue-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm truncate ${
                          notif.read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>{formatReadableDate(notif.createdAt.split('T')[0])}</span>
                      {notif.link && (
                        <button
                          type="button"
                          onClick={() => notif.link && navigate(notif.link)}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Open details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Mark read/unread & Dismiss */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRead(notif)}
                    title={notif.read ? 'Mark as unread' : 'Mark as read'}
                    className="p-1.5 h-8 text-slate-500 hover:text-slate-800 text-xs gap-1"
                  >
                    {notif.read ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Unread</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Read</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notif.id)}
                    title="Dismiss notification"
                    className="p-1.5 h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
