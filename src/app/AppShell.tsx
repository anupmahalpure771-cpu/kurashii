import React, { useRef, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { useWorkspace } from '../workspace/useWorkspace';
import { TasksProvider } from '../features/tasks/TasksProvider';
import { TaskFormDialog } from '../features/tasks/components/TaskFormDialog';

export const AppShell: React.FC = () => {
  const { workspace, isPersonal } = useWorkspace();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Sync document tab title: "Page · Workspace · Kurashii"
  useEffect(() => {
    const wsLabel = isPersonal ? 'Personal' : 'Professional';
    let pageLabel = 'Dashboard';

    if (location.pathname.includes('/tasks')) {
      pageLabel = 'Tasks';
    } else if (location.pathname.includes('/calendar')) {
      pageLabel = 'Calendar';
    } else if (location.pathname.includes('/expenses')) {
      pageLabel = 'Expenses';
    } else if (location.pathname.includes('/meetings')) {
      pageLabel = 'Meetings';
    } else if (location.pathname.includes('/notes')) {
      pageLabel = 'Notes';
    } else if (location.pathname.includes('/goals')) {
      pageLabel = 'Goals & Habits';
    } else if (location.pathname.includes('/chat')) {
      pageLabel = 'Chat';
    } else if (location.pathname.includes('/notifications')) {
      pageLabel = 'Notifications';
    } else if (location.pathname.includes('/settings')) {
      pageLabel = 'Settings';
    }

    document.title = `${pageLabel} · ${wsLabel} · Kurashii`;
  }, [location.pathname, isPersonal]);

  // Global keyboard shortcuts: "/" or Ctrl+K for search, "N" for new task dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      // "/" or Ctrl/Cmd+K focuses search
      if ((e.key === '/' && !isInputActive) || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // "N" opens New Task dialog when no input is focused
      if ((e.key === 'n' || e.key === 'N') && !isInputActive && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setTaskDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <TasksProvider>
      <div className="flex h-screen bg-[#F1F5F9] dark:bg-[#090D16] text-[#111827] dark:text-slate-100 overflow-hidden transition-colors duration-200">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* TopBar */}
          <TopBar searchInputRef={searchInputRef} />

          {/* Scrollable Page Body with 4px subtle upward transition */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
            <div
              key={location.pathname}
              className="max-w-6xl mx-auto animate-fade-up"
            >
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile Nav */}
        <MobileNav />

        {/* Keyboard Shortcut triggered Task Dialog */}
        <TaskFormDialog
          isOpen={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          workspace={workspace}
        />
      </div>
    </TasksProvider>
  );
};
