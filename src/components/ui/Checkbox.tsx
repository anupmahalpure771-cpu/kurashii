import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, id, checked, ...props }, ref) => {
    const checkId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex items-start gap-3">
        <div className="flex items-center h-5">
          <input
            id={checkId}
            ref={ref}
            type="checkbox"
            checked={checked}
            className={`w-4 h-4 rounded text-[var(--accent-ink)] border-slate-300 focus:ring-[var(--accent-ink)] cursor-pointer transition-colors ${className}`}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-sm leading-5">
            {label && (
              <label htmlFor={checkId} className="font-medium text-slate-800 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
