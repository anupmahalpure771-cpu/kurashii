import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../workspace/useWorkspace';
import { useAuth } from '../auth/AuthProvider';
import { Sheet } from '../components/ui/Sheet';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TaskFormDialog } from '../features/tasks/components/TaskFormDialog';
import { Avatar } from '../components/ui/Avatar';
import {
  LayoutDashboard,
  CheckSquare,
  PlusCircle,
  MoreHorizontal,
  Settings,
  LogOut,
  ArrowLeftRight,
  Calendar,
  Wallet,
  FileText,
  Target,
  Users,
  MessageSquare,
  Bell,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { workspace, isPersonal, switchWorkspace } = useWorkspace();
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [moreOpen, setMoreOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dashboardPath = isPersonal ? '/app/personal' : '/app/work';
  const tasksPath = isPersonal ? '/app/personal/tasks' : '/app/work/tasks';
  const calendarPath = isPersonal ? '/app/personal/calendar' : '/app/work/calendar';

  const isDashboardActive = location.pathname === dashboardPath;
  const isTasksActive = location.pathname.startsWith(tasksPath);
  const isCalendarActive = location.pathname.startsWith(calendarPath);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setLogoutConfirmOpen(false);
      setMoreOpen(false);
    }
  };

  return (
    <>
      {/* Bottom Fixed Mobile Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 flex items-center justify-around px-2 transition-colors"
      >
        {/* Dashboard */}
        <Link
          to={dashboardPath}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-[10px] transition-colors ${
            isDashboardActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </Link>

        {/* Tasks */}
        <Link
          to={tasksPath}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-[10px] transition-colors ${
            isTasksActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Tasks</span>
        </Link>

        {/* Quick Add Task */}
        <button
          type="button"
          onClick={() => setTaskDialogOpen(true)}
          aria-label="Add new task"
          className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md cursor-pointer -mt-4 transition-transform active:scale-95"
        >
          <PlusCircle className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Calendar */}
        <Link
          to={calendarPath}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-[10px] transition-colors ${
            isCalendarActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Calendar</span>
        </Link>

        {/* More */}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Open more menu"
          className="flex flex-col items-center justify-center w-14 h-12 rounded-[10px] text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* "More" Sheet on Mobile */}
      <Sheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="Menu &amp; Modules">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-[12px] border border-slate-200 dark:border-slate-700">
            <Avatar
              name={userProfile?.displayName || 'User'}
              avatarColor={userProfile?.avatarColor}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userProfile?.displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{userProfile?.handle}</p>
            </div>
          </div>

          {/* Quick workspace switch */}
          <button
            type="button"
            onClick={() => {
              switchWorkspace(isPersonal ? 'professional' : 'personal');
              setMoreOpen(false);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              <span>Switch to {isPersonal ? '💼 Professional' : '🌱 Personal'}</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Switch workspace</span>
          </button>

          {/* Module Links */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              {isPersonal ? 'Personal Modules' : 'Professional Modules'}
            </p>

            {isPersonal ? (
              <>
                <Link
                  to="/app/personal/expenses"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Expenses &amp; Budget</span>
                </Link>
                <Link
                  to="/app/personal/notes"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Personal Notes</span>
                </Link>
                <Link
                  to="/app/personal/goals"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Goals &amp; Habits</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/app/work/meetings"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Meetings &amp; Scheduler</span>
                </Link>
                <Link
                  to="/app/work/notes"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Work Notes &amp; Minutes</span>
                </Link>
                <Link
                  to="/app/work/goals"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Goals &amp; Habits</span>
                </Link>
                <Link
                  to="/app/work/chat"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Professional Chat</span>
                </Link>
              </>
            )}

            <Link
              to="/app/notifications"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Bell className="w-4 h-4 text-slate-500" />
              <span>In-App Notifications</span>
            </Link>

            <Link
              to="/app/settings"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings &amp; Preferences</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Log Out of Kurashii"
        description="Are you sure you want to log out of your session?"
        confirmLabel="Log out"
        isDestructive={false}
        isLoading={loggingOut}
      />

      <TaskFormDialog
        isOpen={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        workspace={workspace}
      />
    </>
  );
};
