import React from 'react';
import { useWorkspace } from './useWorkspace';
import { User, Briefcase } from 'lucide-react';

export interface WorkspaceSwitcherProps {
  /**
   * Visual variant:
   * - 'topbar': Light-themed segmented switcher tailored for persistent layout headers using CSS variables
   * - 'sidebar': Dark-themed switcher tailored for the application sidebar
   * - 'compact': Icon-centric compact switcher for tight mobile or collapsed displays
   */
  variant?: 'topbar' | 'sidebar' | 'compact';
  compact?: boolean;
  className?: string;
  showLabels?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  variant = 'topbar',
  compact = false,
  className = '',
  showLabels = true,
}) => {
  const { workspace, switchWorkspace, isPersonal, isProfessional } = useWorkspace();

  const isCompactMode = compact || variant === 'compact';
  const isSidebar = variant === 'sidebar';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      switchWorkspace('professional');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      switchWorkspace('personal');
    }
  };

  // Compact Mode (for Mobile header or tight spaces)
  if (isCompactMode) {
    return (
      <div
        role="radiogroup"
        aria-label="Workspace context switcher"
        onKeyDown={handleKeyDown}
        className={`inline-flex items-center p-0.5 rounded-[10px] transition-all duration-200 ${className}`}
        style={{
          backgroundColor: isSidebar ? 'rgba(17, 24, 39, 0.85)' : 'var(--bg)',
          border: isSidebar ? '1px solid rgba(51, 65, 85, 0.7)' : '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          role="radio"
          aria-checked={isPersonal}
          tabIndex={isPersonal ? 0 : -1}
          onClick={() => switchWorkspace('personal')}
          aria-label="Switch to Personal workspace context"
          title="Personal workspace context"
          className="relative px-2.5 py-1 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none"
          style={
            isPersonal
              ? {
                  backgroundColor: 'var(--mint)',
                  color: 'var(--mint-ink)',
                  boxShadow: '0 1px 2px rgba(4, 120, 87, 0.16)',
                  border: '1px solid rgba(4, 120, 87, 0.25)',
                }
              : {
                  backgroundColor: 'transparent',
                  color: isSidebar ? '#94A3B8' : 'var(--text-muted)',
                  border: '1px solid transparent',
                }
          }
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden min-[360px]:inline text-[11px] font-bold">Personal</span>
          {isPersonal && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--mint-ink)' }}
              aria-hidden="true"
            />
          )}
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={isProfessional}
          tabIndex={isProfessional ? 0 : -1}
          onClick={() => switchWorkspace('professional')}
          aria-label="Switch to Professional workspace context"
          title="Professional workspace context"
          className="relative px-2.5 py-1 text-xs font-semibold rounded-[8px] flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none"
          style={
            isProfessional
              ? {
                  backgroundColor: 'var(--sky)',
                  color: 'var(--sky-ink)',
                  boxShadow: '0 1px 2px rgba(29, 78, 216, 0.16)',
                  border: '1px solid rgba(29, 78, 216, 0.25)',
                }
              : {
                  backgroundColor: 'transparent',
                  color: isSidebar ? '#94A3B8' : 'var(--text-muted)',
                  border: '1px solid transparent',
                }
          }
        >
          <Briefcase className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden min-[360px]:inline text-[11px] font-bold">Work</span>
          {isProfessional && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--sky-ink)' }}
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    );
  }

  // Sidebar Variant (Dark Theme integration)
  if (isSidebar) {
    return (
      <div
        role="radiogroup"
        aria-label="Workspace context switcher"
        onKeyDown={handleKeyDown}
        className={`p-1 rounded-[12px] flex items-center select-none ${className}`}
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(51, 65, 85, 0.8)',
        }}
      >
        <button
          type="button"
          role="radio"
          aria-checked={isPersonal}
          tabIndex={isPersonal ? 0 : -1}
          onClick={() => switchWorkspace('personal')}
          aria-label="Personal workspace"
          className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-[9px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          style={
            isPersonal
              ? {
                  backgroundColor: 'var(--mint)',
                  color: 'var(--mint-ink)',
                  boxShadow: '0 1px 3px rgba(4, 120, 87, 0.25)',
                }
              : {
                  color: '#94A3B8',
                  backgroundColor: 'transparent',
                }
          }
        >
          <User className="w-3.5 h-3.5" />
          {showLabels && <span>Personal</span>}
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={isProfessional}
          tabIndex={isProfessional ? 0 : -1}
          onClick={() => switchWorkspace('professional')}
          aria-label="Professional workspace"
          className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-[9px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
          style={
            isProfessional
              ? {
                  backgroundColor: 'var(--sky)',
                  color: 'var(--sky-ink)',
                  boxShadow: '0 1px 3px rgba(29, 78, 216, 0.25)',
                }
              : {
                  color: '#94A3B8',
                  backgroundColor: 'transparent',
                }
          }
        >
          <Briefcase className="w-3.5 h-3.5" />
          {showLabels && <span>Professional</span>}
        </button>
      </div>
    );
  }

  // TopBar / Persistent Header Variant
  // Seamlessly uses the defined CSS variables: --bg, --border, --surface, --mint, --mint-ink, --sky, --sky-ink, --text, --text-muted
  return (
    <div
      role="radiogroup"
      aria-label="Workspace context switcher"
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center p-1 rounded-[12px] shadow-xs transition-all duration-200 select-none ${className}`}
      style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Personal workspace button */}
      <button
        type="button"
        role="radio"
        aria-checked={isPersonal}
        tabIndex={isPersonal ? 0 : -1}
        onClick={() => switchWorkspace('personal')}
        aria-label="Switch to Personal workspace context"
        title="Personal: Tasks, Calendar, Expenses, Notes, Goals & Habits"
        className="group relative px-3 py-1.5 text-xs font-semibold rounded-[9px] flex items-center gap-2 transition-all duration-200 cursor-pointer"
        style={
          isPersonal
            ? {
                backgroundColor: 'var(--mint)',
                color: 'var(--mint-ink)',
                boxShadow: '0 1px 2px rgba(4, 120, 87, 0.16)',
                border: '1px solid rgba(4, 120, 87, 0.25)',
              }
            : {
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid transparent',
              }
        }
      >
        <span
          className="w-2 h-2 rounded-full transition-transform duration-200 shrink-0"
          style={{
            backgroundColor: isPersonal ? 'var(--mint-ink)' : 'var(--text-muted)',
            opacity: isPersonal ? 1 : 0.4,
            transform: isPersonal ? 'scale(1.1)' : 'scale(0.85)',
          }}
          aria-hidden="true"
        />
        <User className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold text-xs tracking-tight">Personal</span>
      </button>

      {/* Professional workspace button */}
      <button
        type="button"
        role="radio"
        aria-checked={isProfessional}
        tabIndex={isProfessional ? 0 : -1}
        onClick={() => switchWorkspace('professional')}
        aria-label="Switch to Professional workspace context"
        title="Professional: Work Tasks, Meetings, Team Calendar, Work Notes, Chat"
        className="group relative px-3 py-1.5 text-xs font-semibold rounded-[9px] flex items-center gap-2 transition-all duration-200 cursor-pointer"
        style={
          isProfessional
            ? {
                backgroundColor: 'var(--sky)',
                color: 'var(--sky-ink)',
                boxShadow: '0 1px 2px rgba(29, 78, 216, 0.16)',
                border: '1px solid rgba(29, 78, 216, 0.25)',
              }
            : {
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid transparent',
              }
        }
      >
        <span
          className="w-2 h-2 rounded-full transition-transform duration-200 shrink-0"
          style={{
            backgroundColor: isProfessional ? 'var(--sky-ink)' : 'var(--text-muted)',
            opacity: isProfessional ? 1 : 0.4,
            transform: isProfessional ? 'scale(1.1)' : 'scale(0.85)',
          }}
          aria-hidden="true"
        />
        <Briefcase className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold text-xs tracking-tight">Professional</span>
      </button>
    </div>
  );
};
