import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { ExpenseTransaction, ExpenseFormData, MonthlyBudget } from './schema';
import {
  subscribeUserExpenses,
  subscribeMonthlyBudgets,
  createExpense,
  updateExpense,
  deleteExpense,
  setMonthlyBudget,
} from './api';
import { ExpenseFormDialog } from './components/ExpenseFormDialog';
import { BudgetModal } from './components/BudgetModal';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { SavingsGoalsCard } from './components/SavingsGoalsCard';
import { exportExpensesToCSV } from './csvExport';
import { Dialog } from '../../components/ui/Dialog';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatMoney } from '../../lib/money';
import { formatReadableDate } from '../../lib/dates';
import { CurrencyCode } from '../../types/models';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Target,
  Edit2,
  Trash2,
  Filter,
  Download,
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const currency: CurrencyCode = userProfile?.currency || 'INR';

  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, MonthlyBudget>>({});
  const [loading, setLoading] = useState(true);

  // Default month: Current month in YYYY-MM
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const currentMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<ExpenseTransaction | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsubExpenses = subscribeUserExpenses(
      user.uid,
      (list) => {
        setTransactions(list);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubBudgets = subscribeMonthlyBudgets(user.uid, (map) => {
      setBudgets(map);
    });

    return () => {
      unsubExpenses();
      unsubBudgets();
    };
  }, [user]);

  // Filter transactions by selected month & category
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const filteredTransactions = monthTransactions.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  // Calculate stats
  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amountMinor, 0);

  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountMinor, 0);

  const netBalance = totalIncome - totalExpenses;

  // Monthly budget
  const currentBudgetMinor =
    budgets[selectedMonth]?.budgetMinor ??
    userProfile?.defaultMonthlyBudgetMinor ??
    0;

  const remainingBudgetMinor = currentBudgetMinor - totalExpenses;

  // Unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(monthTransactions.map((t) => t.category))).sort();

  const handleSaveTransaction = async (data: ExpenseFormData) => {
    if (!user) return;
    if (editingTx) {
      await updateExpense(user.uid, editingTx.id, data);
    } else {
      await createExpense(user.uid, data);
    }
    setEditingTx(null);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingTxId) return;
    setDeleteLoading(true);
    try {
      await deleteExpense(user.uid, deletingTxId);
      setDeletingTxId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveBudget = async (month: string, budgetMinor: number) => {
    if (!user) return;
    await setMonthlyBudget(user.uid, month, budgetMinor);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-600" />
            <span>Personal Expense Tracker</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep track of your personal finances, spending budgets, and cash flow.
          </p>
        </div>

        {/* Actions: Export CSV, Set Budget & Add Transaction */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportExpensesToCSV(filteredTransactions, currency, `kurashii-expenses-${selectedMonth}.csv`)}
            className="flex items-center gap-1.5 text-xs font-semibold"
            title="Download CSV Spreadsheet for taxes or budgeting"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBudgetModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Target className="w-3.5 h-3.5 text-slate-600" />
            <span>Monthly Budget</span>
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setEditingTx(null);
              setFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </Button>
        </div>
      </div>

      {/* Month & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Month:
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="p-4 rounded-xl border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Income</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold font-heading text-emerald-600 tabular-nums">
              {formatMoney(totalIncome, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded for {selectedMonth}</p>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-4 rounded-xl border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold font-heading text-red-600 tabular-nums">
              {formatMoney(totalExpenses, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Outgoing expenditures</p>
          </div>
        </Card>

        {/* Net Balance */}
        <Card className="p-4 rounded-xl border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Balance</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p
              className={`text-2xl font-bold font-heading tabular-nums ${
                netBalance >= 0 ? 'text-slate-900' : 'text-red-600'
              }`}
            >
              {formatMoney(netBalance, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Income minus expenses</p>
          </div>
        </Card>

        {/* Spending Budget */}
        <Card className="p-4 rounded-xl border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Remaining Budget</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                remainingBudgetMinor < 0
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p
              className={`text-2xl font-bold font-heading tabular-nums ${
                remainingBudgetMinor < 0 ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {formatMoney(remainingBudgetMinor, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Budget: {currentBudgetMinor > 0 ? formatMoney(currentBudgetMinor, currency) : 'Not set'}
            </p>
          </div>
        </Card>
      </div>

      {/* Savings Goals Milestone Progress */}
      <SavingsGoalsCard currency={currency} />

      {/* Main Grid: Transactions List (left) & Category Breakdown (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transactions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-lg text-slate-900">
              Transactions ({filteredTransactions.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No transactions found"
              description="Record income or expenses to track your spending habits and stay on budget."
              actionLabel="Add Transaction"
              onAction={() => {
                setEditingTx(null);
                setFormOpen(true);
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                return (
                  <Card
                    key={tx.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isExpense
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {isExpense ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {tx.description || tx.category}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-medium text-slate-600">{tx.category}</span>
                            <span>·</span>
                            <span>{formatReadableDate(tx.date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-sm font-bold font-heading tabular-nums ${
                            isExpense ? 'text-slate-900' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatMoney(tx.amountMinor, currency)}
                        </span>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTx(tx);
                              setFormOpen(true);
                            }}
                            className="p-1 h-7 w-7 text-slate-400 hover:text-slate-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTxId(tx.id)}
                            className="p-1 h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Category Breakdown Card */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <h3 className="font-heading font-semibold text-base text-slate-900 mb-1">
              Spending by Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribution of your expenses in {selectedMonth}
            </p>
            <CategoryBreakdown
              transactions={monthTransactions}
              totalExpensesMinor={totalExpenses}
              currency={currency}
            />
          </div>
        </div>
      </div>

      {/* Expense Form Dialog */}
      <ExpenseFormDialog
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSaveTransaction}
        initialTransaction={editingTx}
        currency={currency}
      />

      {/* Budget Modal */}
      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        currentBudgetMinor={currentBudgetMinor}
        month={selectedMonth}
        onSave={handleSaveBudget}
        currency={currency}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTxId)}
        onClose={() => setDeletingTxId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        description="Are you sure you want to delete this financial record? It will be permanently removed from your dashboard totals."
        confirmLabel="Delete Transaction"
        isDestructive={true}
        isLoading={deleteLoading}
      />
    </div>
  );
};
