import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex items-center border-b border-slate-200 gap-6 ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer select-none flex items-center gap-2 ${
              isActive ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full tabular-nums font-semibold ${
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full transition-all duration-200"
                style={{ backgroundColor: 'var(--accent-ink)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
