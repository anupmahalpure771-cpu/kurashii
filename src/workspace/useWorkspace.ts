import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { WorkspaceType } from '../types/models';
import { useEffect, useMemo, useCallback } from 'react';

export function useWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, updateProfile } = useAuth();

  // Single source of truth: derived from URL
  const workspace: WorkspaceType = useMemo(() => {
    if (location.pathname.startsWith('/app/work')) {
      return 'professional';
    }
    if (location.pathname.startsWith('/app/personal')) {
      return 'personal';
    }
    return userProfile?.lastWorkspace || userProfile?.primaryUse || 'personal';
  }, [location.pathname, userProfile]);

  // Keep data-workspace attribute on document.body for CSS variable tokens
  useEffect(() => {
    document.body.setAttribute('data-workspace', workspace);
  }, [workspace]);

  // Switch workspace logic with context preservation
  const switchWorkspace = useCallback(
    async (targetWorkspace: WorkspaceType) => {
      if (targetWorkspace === workspace) return;

      const currentPath = location.pathname;
      let targetPath = targetWorkspace === 'personal' ? '/app/personal' : '/app/work';

      // Equivalent page navigation across workspaces
      if (currentPath.includes('/tasks')) {
        targetPath = targetWorkspace === 'personal' ? '/app/personal/tasks' : '/app/work/tasks';
      } else if (currentPath.includes('/calendar')) {
        targetPath = targetWorkspace === 'personal' ? '/app/personal/calendar' : '/app/work/calendar';
      } else if (currentPath.includes('/notes')) {
        targetPath = targetWorkspace === 'personal' ? '/app/personal/notes' : '/app/work/notes';
      } else if (currentPath.includes('/expenses')) {
        targetPath = targetWorkspace === 'personal' ? '/app/personal/expenses' : '/app/work';
      } else if (currentPath.includes('/meetings')) {
        targetPath = targetWorkspace === 'personal' ? '/app/personal/calendar' : '/app/work/meetings';
      } else if (currentPath.includes('/chat')) {
        targetPath = targetWorkspace === 'personal' ? '/app/personal' : '/app/work/chat';
      } else if (currentPath.includes('/goals')) {
        targetPath = targetWorkspace === 'personal' ? '/app/personal/goals' : '/app/work';
      } else if (currentPath === '/app/settings' || currentPath === '/app/notifications') {
        // Retain current settings or notifications page context
        targetPath = currentPath;
      }

      // Update user preference in Firestore asynchronously
      if (userProfile && updateProfile) {
        updateProfile({ lastWorkspace: targetWorkspace }).catch((err) => {
          console.warn('Failed to persist lastWorkspace:', err);
        });
      }

      navigate(targetPath);
    },
    [workspace, location.pathname, navigate, userProfile, updateProfile]
  );

  return {
    workspace,
    isPersonal: workspace === 'personal',
    isProfessional: workspace === 'professional',
    switchWorkspace,
  };
}
