import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../workspace/useWorkspace';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { useAuth } from '../auth/AuthProvider';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { TaskFormDialog } from '../features/tasks/components/TaskFormDialog';
import { EventFormDialog } from '../features/calendar/components/EventFormDialog';
import { ExpenseFormDialog } from '../features/expenses/components/ExpenseFormDialog';
import { MeetingFormDialog } from '../features/meetings/components/MeetingFormDialog';
import { NoteFormDialog } from '../features/notes/components/NoteFormDialog';
import { NotificationsPopover } from '../features/notifications/components/NotificationsPopover';
import { AppNotification } from '../features/notifications/schema';
import { subscribeUserNotifications } from '../features/notifications/api';
import { createCalendarEvent } from '../features/calendar/api';
import { createExpense } from '../features/expenses/api';
import { createMeeting, fetchRegisteredUsers } from '../features/meetings/api';
import { createNote } from '../features/notes/api';
import { ParticipantUser } from '../features/meetings/schema';
import { FocusTimerModal } from '../features/focus/FocusTimerModal';
import { BalanceModal } from '../features/balance/BalanceModal';
import { calculateBalanceMetrics } from '../features/balance/balanceUtils';
import { SearchGroundingModal } from '../features/searchGrounding/SearchGroundingModal';
import { useTasks } from '../features/tasks/hooks';
import {
  Search,
  Plus,
  CheckSquare,
  Calendar,
  Wallet,
  Users,
  FileText,
  ChevronRight,
  X,
  Sparkles,
  Scale,
  Globe,
} from 'lucide-react';

interface TopBarProps {
  onSearchFocus?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const TopBar: React.FC<TopBarProps> = ({ searchInputRef }) => {
  const { workspace, isPersonal } = useWorkspace();
  const { user, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Quick action modals
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [searchGroundingOpen, setSearchGroundingOpen] = useState(false);
  const { tasks } = useTasks();
  const balanceMetrics = React.useMemo(() => calculateBalanceMetrics(tasks, [], []), [tasks]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<ParticipantUser[]>([]);

  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRegisteredUsers().then(setRegisteredUsers);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserNotifications(user.uid, (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [user]);

  // Focus mobile input when opened
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  // Derive breadcrumbs & page title
  const getBreadcrumbInfo = () => {
    const path = location.pathname;
    const workspaceRoot = isPersonal ? '/app/personal' : '/app/work';
    const workspaceName = isPersonal ? 'Personal' : 'Professional';

    if (path === '/app/settings') {
      return { title: 'Settings', breadcrumbs: [{ label: 'Settings', path: '/app/settings' }] };
    }
    if (path === '/app/notifications') {
      return { title: 'Notifications', breadcrumbs: [{ label: 'Notifications', path: '/app/notifications' }] };
    }
    if (path.includes('/tasks')) {
      return {
        title: 'Tasks',
        breadcrumbs: [{ label: workspaceName, path: workspaceRoot }, { label: 'Tasks', path }],
      };
    }
    if (path.includes('/calendar')) {
      return {
        title: 'Calendar',
        breadcrumbs: [{ label: workspaceName, path: workspaceRoot }, { label: 'Calendar', path }],
      };
    }
    if (path.includes('/expenses')) {
      return {
        title: 'Expenses',
        breadcrumbs: [{ label: workspaceName, path: workspaceRoot }, { label: 'Expenses', path }],
      };
    }
    if (path.includes('/meetings')) {
      return {
        title: 'Meetings',
        breadcrumbs: [{ label: workspaceName, path: workspaceRoot }, { label: 'Meetings', path }],
      };
    }
    if (path.includes('/notes')) {
      return {
        title: 'Notes',
        breadcrumbs: [{ label: workspaceName, path: workspaceRoot }, { label: 'Notes', path }],
      };
    }
    if (path.includes('/goals')) {
      return {
        title: 'Goals & Habits',
        breadcrumbs: [{ label: workspaceName, path: workspaceRoot }, { label: 'Goals & Habits', path }],
      };
    }
    if (path.includes('/chat')) {
      return {
        title: 'Chat',
        breadcrumbs: [{ label: workspaceName, path: workspaceRoot }, { label: 'Chat', path }],
      };
    }

    return {
      title: 'Dashboard',
      breadcrumbs: [{ label: workspaceName, path: workspaceRoot }],
    };
  };

  const { breadcrumbs } = getBreadcrumbInfo();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tasksPath = isPersonal ? '/app/personal/tasks' : '/app/work/tasks';
    const q = searchQuery.trim();
    navigate(q ? `${tasksPath}?q=${encodeURIComponent(q)}` : tasksPath);
    setMobileSearchOpen(false);
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors duration-150">
        {/* Full-width mobile search bar overlay */}
        {mobileSearchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex sm:hidden items-center w-full gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${isPersonal ? 'Personal' : 'Professional'} items...`}
                className="w-full h-10 pl-9 pr-3 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[10px] text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)]"
              />
            </div>
            <IconButton
              size="sm"
              aria-label="Close search"
              onClick={() => setMobileSearchOpen(false)}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </form>
        ) : (
          <>
            {/* Left: Mobile Logo & Switcher / Desktop Clean Breadcrumbs */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex md:hidden items-center gap-2">
                <Link to={isPersonal ? '/app/personal' : '/app/work'}>
                  <Logo size={24} showWordmark={false} />
                </Link>
                <WorkspaceSwitcher compact />
              </div>

              <div className="hidden md:flex items-center">
                <nav
                  aria-label="Breadcrumb"
                  className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.path}>
                      {idx > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 dark:text-slate-600" />}
                      {idx === breadcrumbs.length - 1 ? (
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                          {idx === 0 && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isPersonal ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              aria-hidden="true"
                            />
                          )}
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          to={crumb.path}
                          className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          {idx === 0 && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isPersonal ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              aria-hidden="true"
                            />
                          )}
                          <span>{crumb.label}</span>
                        </Link>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              </div>
            </div>

            {/* Center: Desktop Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${isPersonal ? 'Personal' : 'Professional'} (Press "/" or Ctrl+K)`}
                  className="w-full h-9 pl-9 pr-12 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 rounded-[10px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)] transition-all"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                    /
                  </kbd>
                </div>
              </div>
            </form>

            {/* Right: Focus Mode, Balance, Notifications Popover & "+ New" Action Dropdown */}
            <div className="flex items-center gap-2">
              <IconButton
                size="sm"
                aria-label="Open search"
                onClick={() => setMobileSearchOpen(true)}
                className="flex sm:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                <Search className="w-4 h-4" />
              </IconButton>

              {/* Google Search Grounding Intelligence Quick Launcher */}
              <button
                type="button"
                onClick={() => setSearchGroundingOpen(true)}
                title="Search with Google (Real-Time Grounded Web Intelligence)"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[10px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer border border-blue-200/80 dark:border-blue-800/80"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden md:inline">Google Intel</span>
              </button>

              {/* Focus Mode Quick Launcher */}
              <button
                type="button"
                onClick={() => setFocusModalOpen(true)}
                title="Launch Focus Mode (Pomodoro & Ambient Audio)"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Focus</span>
              </button>

              {/* Work-Life Balance Sync Score */}
              <button
                type="button"
                onClick={() => setBalanceModalOpen(true)}
                title="View Work-Life Balance Sync Score & Boundary Hours"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sync {balanceMetrics.score}%</span>
              </button>

              {/* Genuine Persisted Notifications Popover */}
              <NotificationsPopover
                notifications={notifications}
                currentUserId={user?.uid || ''}
              />

              {/* "+ New" Action Button with Context-Aware Options */}
              <DropdownMenu
                align="right"
                trigger={
                  <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    <span className="font-semibold text-xs">New</span>
                  </Button>
                }
                items={
                  isPersonal
                    ? [
                        {
                          label: 'New Task',
                          icon: <CheckSquare className="w-4 h-4" />,
                          onClick: () => setTaskDialogOpen(true),
                        },
                        {
                          label: 'New Calendar Event',
                          icon: <Calendar className="w-4 h-4" />,
                          onClick: () => setEventDialogOpen(true),
                        },
                        {
                          label: 'Record Expense',
                          icon: <Wallet className="w-4 h-4" />,
                          onClick: () => setExpenseDialogOpen(true),
                        },
                        {
                          label: 'New Note',
                          icon: <FileText className="w-4 h-4" />,
                          onClick: () => setNoteDialogOpen(true),
                        },
                        {
                          label: 'Google Search Intel',
                          icon: <Globe className="w-4 h-4 text-blue-500" />,
                          onClick: () => setSearchGroundingOpen(true),
                        },
                      ]
                    : [
                        {
                          label: 'New Work Task',
                          icon: <CheckSquare className="w-4 h-4" />,
                          onClick: () => setTaskDialogOpen(true),
                        },
                        {
                          label: 'Schedule Meeting',
                          icon: <Users className="w-4 h-4" />,
                          onClick: () => setMeetingDialogOpen(true),
                        },
                        {
                          label: 'New Calendar Event',
                          icon: <Calendar className="w-4 h-4" />,
                          onClick: () => setEventDialogOpen(true),
                        },
                        {
                          label: 'Meeting Minutes / Note',
                          icon: <FileText className="w-4 h-4" />,
                          onClick: () => setNoteDialogOpen(true),
                        },
                        {
                          label: 'Google Search Intel',
                          icon: <Globe className="w-4 h-4 text-blue-500" />,
                          onClick: () => setSearchGroundingOpen(true),
                        },
                      ]
                }
              />
            </div>
          </>
        )}
      </header>

      {/* Global Quick Action Dialogs */}
      <TaskFormDialog
        isOpen={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        workspace={workspace}
      />

      <EventFormDialog
        isOpen={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        onSubmit={async (data) => {
          if (user) await createCalendarEvent(user.uid, data);
        }}
        defaultWorkspace={workspace}
      />

      {isPersonal && (
        <ExpenseFormDialog
          isOpen={expenseDialogOpen}
          onClose={() => setExpenseDialogOpen(false)}
          onSubmit={async (data) => {
            if (user) await createExpense(user.uid, data);
          }}
          currency={userProfile?.currency || 'INR'}
        />
      )}

      {!isPersonal && (
        <MeetingFormDialog
          isOpen={meetingDialogOpen}
          onClose={() => setMeetingDialogOpen(false)}
          onSubmit={async (data) => {
            if (user) {
              await createMeeting(
                user.uid,
                userProfile?.displayName || 'Colleague',
                data,
                registeredUsers
              );
            }
          }}
          existingMeetings={[]}
          registeredUsers={registeredUsers}
          currentUserId={user?.uid || ''}
        />
      )}

      <NoteFormDialog
        isOpen={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        onSubmit={async (data) => {
          if (user) await createNote(user.uid, data);
        }}
        defaultWorkspace={workspace}
      />

      <FocusTimerModal
        isOpen={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
      />

      <BalanceModal
        isOpen={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        metrics={balanceMetrics}
      />

      <SearchGroundingModal
        isOpen={searchGroundingOpen}
        onClose={() => setSearchGroundingOpen(false)}
      />
    </>
  );
};
