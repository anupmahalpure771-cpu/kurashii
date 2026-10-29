import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-[16px] p-5 border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_2px_rgba(17,24,39,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] text-slate-900 dark:text-slate-100 transition-colors duration-150 ${
        hoverEffect
          ? 'hover:shadow-[0_4px_12px_rgba(17,24,39,0.08)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:-translate-y-[1px] transition-all duration-150'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
