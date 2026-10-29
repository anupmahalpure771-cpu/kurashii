import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {/* 48px accent-tinted circle */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-xs"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-ink)',
        }}
      >
        <Icon className="w-6 h-6 stroke-[2]" />
      </div>
      {title && <h3 className="font-heading font-semibold text-slate-800 text-base mb-1">{title}</h3>}
      <p className="text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
