export type TransactionType = 'income' | 'expense';

export interface ExpenseTransaction {
  id: string;
  type: TransactionType;
  amountMinor: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  type: TransactionType;
  amountMinor: number;
  category: string;
  date: string;
  description: string;
  receiptUrl?: string;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  budgetMinor: number;
  updatedAt: string;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Housing & Rent',
  'Groceries & Food',
  'Dining Out',
  'Transportation',
  'Utilities & Bills',
  'Health & Wellness',
  'Entertainment',
  'Shopping',
  'Education',
  'Personal Care',
  'Travel',
  'Other Expense',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary & Wages',
  'Freelance & Consulting',
  'Investments & Dividends',
  'Rental Income',
  'Gifts & Grants',
  'Other Income',
];
