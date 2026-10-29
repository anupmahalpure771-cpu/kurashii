import React from 'react';

export const AVATAR_COLORS = [
  { id: 'emerald', label: 'Emerald Mint', hex: '#047857', bg: '#D1FAE5' },
  { id: 'blue', label: 'Sky Blue', hex: '#1D4ED8', bg: '#DBEAFE' },
  { id: 'violet', label: 'Royal Violet', hex: '#6D28D9', bg: '#EDE9FE' },
  { id: 'amber', label: 'Warm Amber', hex: '#B45309', bg: '#FEF3C7' },
  { id: 'rose', label: 'Rose Pink', hex: '#BE123C', bg: '#FFE4E6' },
  { id: 'teal', label: 'Deep Teal', hex: '#0F766E', bg: '#CCFBF1' },
];

export interface AvatarProps {
  name: string;
  avatarColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarColor,
  size = 'md',
  className = '',
}) => {
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  // Find color config or fallback
  const matched = AVATAR_COLORS.find(c => c.hex === avatarColor || c.id === avatarColor);
  const textColor = matched ? matched.hex : '#111827';
  const bgColor = matched ? matched.bg : '#E2E8F0';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl font-bold',
  }[size];

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className={`inline-flex items-center justify-center font-heading font-semibold rounded-full select-none shrink-0 shadow-xs border border-white/60 ${sizeClasses} ${className}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
};
