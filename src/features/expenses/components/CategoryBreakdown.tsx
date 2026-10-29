import React from 'react';
import { ExpenseTransaction } from '../schema';
import { formatMoney } from '../../../lib/money';
import { CurrencyCode } from '../../../types/models';

interface CategoryBreakdownProps {
  transactions: ExpenseTransaction[];
  totalExpensesMinor: number;
  currency?: CurrencyCode;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  transactions,
  totalExpensesMinor,
  currency = 'INR',
}) => {
  // Aggregate expenses by category
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amountMinor;
    });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-400">
        No expense transactions recorded for this period.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedCategories.map(([category, amountMinor]) => {
        const percentage =
          totalExpensesMinor > 0 ? Math.round((amountMinor / totalExpensesMinor) * 100) : 0;

        return (
          <div key={category} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-700 truncate">{category}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">{percentage}%</span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(amountMinor, currency)}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
