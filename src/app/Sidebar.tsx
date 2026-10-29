import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWorkspace } from '../workspace/useWorkspace';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { useAuth } from '../auth/AuthProvider';
import { Logo } from '../components/ui/Logo';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Wallet,
  FileText,
  Target,
  Users,
  MessageSquare,
  Bell,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { workspace } = useWorkspace();
  const { userProfile, logout } = useAuth();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems =
    workspace === 'personal'
      ? [
          { label: 'Dashboard', path: '/app/personal', icon: LayoutDashboard },
          { label: 'Tasks', path: '/app/personal/tasks', icon: CheckSquare },
          { label: 'Calendar', path: '/app/personal/calendar', icon: Calendar },
          { label: 'Expenses', path: '/app/personal/expenses', icon: Wallet },
          { label: 'Notes', path: '/app/personal/notes', icon: FileText },
          { label: 'Goals & Habits', path: '/app/personal/goals', icon: Target },
        ]
      : [
          { label: 'Dashboard', path: '/app/work', icon: LayoutDashboard },
          { label: 'Tasks', path: '/app/work/tasks', icon: CheckSquare },
          { label: 'Calendar', path: '/app/work/calendar', icon: Calendar },
          { label: 'Meetings', path: '/app/work/meetings', icon: Users },
          { label: 'Work Notes', path: '/app/work/notes', icon: FileText },
          { label: 'Goals & Habits', path: '/app/work/goals', icon: Target },
          { label: 'Chat', path: '/app/work/chat', icon: MessageSquare },
        ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <aside className="hidden md:flex flex-col w-[72px] lg:w-[260px] bg-[#111827] text-white h-screen shrink-0 border-r border-slate-800 transition-all duration-200 select-none">
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start px-4 lg:px-6 border-b border-slate-800/80">
          <Link to={workspace === 'personal' ? '/app/personal' : '/app/work'} className="hover:opacity-90">
            <Logo theme="light" showWordmark={true} className="hidden lg:flex" />
            <Logo theme="light" showWordmark={false} className="flex lg:hidden" />
          </Link>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 lg:px-4 lg:py-3.5 border-b border-slate-800/60">
          <p className="hidden lg:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Workspace
          </p>
          <div className="hidden lg:block">
            <WorkspaceSwitcher variant="sidebar" />
          </div>
          <div className="flex lg:hidden justify-center">
            <WorkspaceSwitcher variant="sidebar" compact />
          </div>
        </div>

        {/* Main Nav Items */}
        <nav className="flex-1 px-2.5 lg:px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/app/personal' || item.path === '/app/work'
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-slate-800/90 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                {/* Active nav indicator bar on desktop */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full transition-all duration-200"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-[var(--accent)]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="hidden lg:inline truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 my-2 border-t border-slate-800/60">
            <Link
              to="/app/notifications"
              title="Notifications"
              className={`relative flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-all duration-150 group ${
                location.pathname === '/app/notifications'
                  ? 'bg-slate-800/90 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <Bell className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-200" />
              <span className="hidden lg:inline truncate">Notifications</span>
            </Link>
          </div>
        </nav>

        {/* Profile Menu Pinned at Bottom */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2.5">
            <Link
              to="/app/settings"
              className="flex items-center gap-2.5 p-1 rounded-[10px] hover:bg-slate-800/60 flex-1 min-w-0 transition-colors"
              title="Settings"
            >
              <Avatar
                name={userProfile?.displayName || userProfile?.handle || 'U'}
                avatarColor={userProfile?.avatarColor}
                size="sm"
              />
              <div className="hidden lg:block min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-white truncate">
                  {userProfile?.displayName || 'My Account'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  @{userProfile?.handle || 'user'}
                </p>
              </div>
            </Link>

            <Link
              to="/app/settings"
              aria-label="Account Settings"
              className="hidden lg:flex text-slate-400 hover:text-white p-1.5 rounded-[8px] hover:bg-slate-800/60"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>

            <button
              type="button"
              aria-label="Log out"
              onClick={() => setShowLogoutConfirm(true)}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-[8px] hover:bg-slate-800/60 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log Out of Kurashii"
        description="Are you sure you want to log out of your session?"
        confirmLabel="Log out"
        isDestructive={false}
        isLoading={loggingOut}
      />
    </>
  );
};
