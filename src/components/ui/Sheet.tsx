import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = 'bottom',
}) => {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {position === 'bottom' ? (
        <div className="fixed inset-x-0 bottom-0 z-10 max-h-[90vh] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-t-[20px] shadow-2xl border-t border-slate-200 dark:border-slate-800 p-5 overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              {title && <h2 className="font-heading font-semibold text-lg text-slate-900 dark:text-slate-100">{title}</h2>}
              {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
            <IconButton size="sm" aria-label="Close sheet" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto pb-4">{children}</div>
        </div>
      ) : (
        <div className="fixed inset-y-0 right-0 z-10 w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              {title && <h2 className="font-heading font-semibold text-lg text-slate-900 dark:text-slate-100">{title}</h2>}
              {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
            <IconButton size="sm" aria-label="Close sheet" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      )}
    </div>
  );
};
