import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  }[size];

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    accent: 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold border border-[var(--accent)]/40',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    sky: 'bg-blue-50 text-blue-700 border border-blue-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full transition-colors ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
