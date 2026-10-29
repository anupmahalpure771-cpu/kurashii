import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { Login } from '../auth/Login';
import { Signup } from '../auth/Signup';
import { ForgotPassword } from '../auth/ForgotPassword';
import { Onboarding } from '../auth/Onboarding';
import { RequireAuth } from '../auth/RequireAuth';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { AppShell } from './AppShell';
import { AppRedirect } from './AppRedirect';
import { PersonalDashboard } from '../features/dashboard/PersonalDashboard';
import { WorkDashboard } from '../features/dashboard/WorkDashboard';
import { PersonalTasksPage } from '../features/tasks/PersonalTasksPage';
import { WorkTasksPage } from '../features/tasks/WorkTasksPage';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { MeetingsPage } from '../features/meetings/MeetingsPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { NotesPage } from '../features/notes/NotesPage';
import { GoalsPage } from '../features/goals/GoalsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { ChatPage } from '../features/chat/ChatPage';
import { Settings } from '../features/settings/Settings';
import { NotFound } from './NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/onboarding',
    element: (
      <RequireAuth>
        <Onboarding />
      </RequireAuth>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AppRedirect />,
      },
      // Personal Workspace Routes
      {
        path: 'personal',
        element: <PersonalDashboard />,
      },
      {
        path: 'personal/tasks',
        element: <PersonalTasksPage />,
      },
      {
        path: 'personal/calendar',
        element: <CalendarPage />,
      },
      {
        path: 'personal/expenses',
        element: <ExpensesPage />,
      },
      {
        path: 'personal/notes',
        element: <NotesPage />,
      },
      {
        path: 'personal/goals',
        element: <GoalsPage />,
      },

      // Professional Workspace Routes
      {
        path: 'work',
        element: <WorkDashboard />,
      },
      {
        path: 'work/tasks',
        element: <WorkTasksPage />,
      },
      {
        path: 'work/calendar',
        element: <CalendarPage />,
      },
      {
        path: 'work/meetings',
        element: <MeetingsPage />,
      },
      {
        path: 'work/notes',
        element: <NotesPage />,
      },
      {
        path: 'work/goals',
        element: <GoalsPage />,
      },
      {
        path: 'work/chat',
        element: <ChatPage />,
      },

      // Shared Global Routes
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '/404',
    element: <NotFound />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
], {
  basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
});
