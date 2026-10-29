import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  ExpenseTransaction,
  ExpenseFormData,
  TransactionType,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../schema';
import { toMinorUnits, fromMinorUnits } from '../../../lib/money';
import { CurrencyCode } from '../../../types/models';
import { AlertCircle, IndianRupee, Tag, Calendar as CalendarIcon, DollarSign } from 'lucide-react';

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialTransaction?: ExpenseTransaction | null;
  currency?: CurrencyCode;
}

export const ExpenseFormDialog: React.FC<ExpenseFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTransaction,
  currency = 'INR',
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountStr(String(fromMinorUnits(initialTransaction.amountMinor)));
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date);
      setDescription(initialTransaction.description || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setType('expense');
      setAmountStr('');
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
      setDate(today);
      setDescription('');
    }
    setError(null);
  }, [initialTransaction, isOpen]);

  // Adjust default category when type toggles if creating new
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!initialTransaction) {
      setCategory(
        newType === 'expense' ? DEFAULT_EXPENSE_CATEGORIES[0] : DEFAULT_INCOME_CATEGORIES[0]
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!category.trim()) {
      setError('Category is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        type,
        amountMinor: toMinorUnits(parsedAmount),
        category: category.trim(),
        date,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const categories =
    type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  const CurrencyIcon = currency === 'INR' ? IndianRupee : DollarSign;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              type === 'expense'
                ? 'bg-white dark:bg-slate-700 text-red-700 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-900/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            💸 Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              type === 'income'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-900/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            💰 Income
          </button>
        </div>

        {/* Manual Amount Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <CurrencyIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Amount ({currency}) *</span>
            </span>
            <span className="text-[11px] text-slate-400">Type amount manually</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              step="any"
              min="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g. 2500"
              required
              autoFocus
              className="text-base font-semibold"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Typed amounts sync instantly with your monthly budget, category breakdowns, and dashboard totals.
          </p>
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category *</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)]"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Date *</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Description / Memo */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Note / Description (Optional)
          </label>
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Organic vegetables, Electricity bill, Freelance milestone..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            isLoading={loading}
            className={
              type === 'expense'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }
          >
            {initialTransaction ? 'Save Changes' : type === 'expense' ? 'Add Expense' : 'Add Income'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
