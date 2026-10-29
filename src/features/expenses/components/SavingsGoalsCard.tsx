import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { formatMoney, fromMinorUnits, toMinorUnits } from '../../../lib/money';
import { CurrencyCode } from '../../../types/models';
import { PiggyBank, Plus, TrendingUp, Sparkles } from 'lucide-react';

export interface SavingsGoal {
  id: string;
  title: string;
  targetMinor: number;
  currentMinor: number;
  category: string;
}

const DEFAULT_GOALS: SavingsGoal[] = [
  {
    id: 'g-1',
    title: 'Emergency Rainy Day Fund',
    targetMinor: 10000000, // 100,000.00
    currentMinor: 6500000, // 65,000.00
    category: 'Safety',
  },
  {
    id: 'g-2',
    title: 'Kyoto Travel & Retreat',
    targetMinor: 5000000, // 50,000.00
    currentMinor: 3200000, // 32,000.00
    category: 'Travel',
  },
  {
    id: 'g-3',
    title: 'Home Ergonomic Setup',
    targetMinor: 2500000, // 25,000.00
    currentMinor: 2100000, // 21,000.00
    category: 'Equipment',
  },
];

interface SavingsGoalsCardProps {
  currency: CurrencyCode;
}

export const SavingsGoalsCard: React.FC<SavingsGoalsCardProps> = ({ currency }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('kurashii_savings_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const saveGoals = (updated: SavingsGoal[]) => {
    setGoals(updated);
    localStorage.setItem('kurashii_savings_goals', JSON.stringify(updated));
  };

  const handleDeposit = (goalId: string) => {
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num <= 0) return;
    const addMinor = toMinorUnits(num);

    const updated = goals.map((g) => {
      if (g.id === goalId) {
        return { ...g, currentMinor: Math.min(g.currentMinor + addMinor, g.targetMinor * 2) };
      }
      return g;
    });

    saveGoals(updated);
    setDepositGoalId(null);
    setDepositAmount('');
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Personal Savings Goals
            </h3>
            <p className="text-[11px] text-slate-500">
              Grow reserve funds and track progress toward milestone purchases.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {goals.map((g) => {
          const percent = Math.min(Math.round((g.currentMinor / g.targetMinor) * 100), 100);
          return (
            <div
              key={g.id}
              className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span className="truncate pr-1">{g.title}</span>
                  <span className="text-emerald-700 font-bold shrink-0">{percent}%</span>
                </div>

                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mt-2">
                  <span>{formatMoney(g.currentMinor, currency)}</span>
                  <span className="text-slate-400">of {formatMoney(g.targetMinor, currency)}</span>
                </div>
              </div>

              {depositGoalId === g.id ? (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Amount"
                    autoFocus
                    className="w-full h-7 px-2 text-xs bg-white border border-slate-300 rounded-md"
                  />
                  <Button size="sm" variant="accent" onClick={() => handleDeposit(g.id)} className="h-7 px-2 text-[10px]">
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDepositGoalId(null)} className="h-7 px-1.5 text-[10px]">
                    ✕
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDepositGoalId(g.id)}
                  className="w-full h-7 text-[11px] gap-1 font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
                >
                  <Plus className="w-3 h-3" />
                  <span>Deposit Funds</span>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
