import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { toMinorUnits, fromMinorUnits } from '../../../lib/money';
import { CurrencyCode } from '../../../types/models';
import { IndianRupee } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudgetMinor: number;
  month: string;
  onSave: (month: string, budgetMinor: number) => Promise<void>;
  currency?: CurrencyCode;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  currentBudgetMinor,
  month,
  onSave,
  currency = 'INR',
}) => {
  const [budgetStr, setBudgetStr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBudgetStr(currentBudgetMinor > 0 ? String(fromMinorUnits(currentBudgetMinor)) : '');
    }
  }, [isOpen, currentBudgetMinor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetStr);
    const budgetMinor = isNaN(val) || val < 0 ? 0 : toMinorUnits(val);

    setLoading(true);
    try {
      await onSave(month, budgetMinor);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Set Monthly Spending Budget"
      description={`Set your target maximum spending limit for ${month}.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Spending Budget ({currency})</span>
          </label>
          <Input
            type="number"
            min="0"
            step="100"
            value={budgetStr}
            onChange={(e) => setBudgetStr(e.target.value)}
            placeholder="e.g. 50000"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" isLoading={loading}>
            Save Budget
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
