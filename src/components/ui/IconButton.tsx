import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Strictly mandatory for accessibility
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = '', variant = 'ghost', size = 'md', isLoading = false, disabled, children, 'aria-label': ariaLabel, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2';

    const sizeStyles = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
    }[size];

    const variantStyles = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-slate-400',
      ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-slate-400',
      outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500',
      danger: 'text-red-600 hover:bg-red-50 focus-visible:outline-red-600',
    }[variant];

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
