import React from 'react';

export interface LogoProps {
  className?: string;
  theme?: 'dark' | 'light'; // dark means dark text (on white/light bg), light means white text (on navy sidebar)
  showWordmark?: boolean;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  theme = 'dark',
  showWordmark = true,
  size = 28,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative shrink-0 overflow-hidden rounded-[8px] shadow-xs border border-emerald-950/30 bg-[#0A1813]"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src={`${import.meta.env.BASE_URL}kurashii-emblem.jpg`}
          alt="Kurashii Botanical Gold Logo"
          width={size}
          height={size}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {showWordmark && (
        <span
          className={`font-heading font-bold text-lg tracking-tight lowercase ${
            theme === 'light' ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
        >
          kurashii
        </span>
      )}
    </div>
  );
};
