import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { ExpenseTransaction, ExpenseFormData, MonthlyBudget } from './schema';
import { DEMO_UID } from '../tasks/api';

const DEMO_EXPENSES_KEY = 'kurashii_demo_expenses';
const DEMO_BUDGETS_KEY = 'kurashii_demo_budgets';
const DEMO_EXPENSES_CHANGED = 'kurashii_demo_expenses_changed';

function getDemoSeedExpenses(): { transactions: ExpenseTransaction[]; budgets: Record<string, MonthlyBudget> } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const currentMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  const todayStr = format(now);
  const day2 = new Date(now);
  day2.setDate(day2.getDate() - 2);
  const day2Str = format(day2);

  const day5 = new Date(now);
  day5.setDate(day5.getDate() - 5);
  const day5Str = format(day5);

  const transactions: ExpenseTransaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      amountMinor: 8500000, // ₹85,000
      category: 'Salary & Wages',
      date: `${currentMonth}-01`,
      description: 'Monthly consulting stipend',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'tx-2',
      type: 'expense',
      amountMinor: 2200000, // ₹22,000
      category: 'Housing & Rent',
      date: `${currentMonth}-02`,
      description: 'Apartment rent & society maintenance',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'tx-3',
      type: 'expense',
      amountMinor: 450000, // ₹4,500
      category: 'Groceries & Food',
      date: day5Str,
      description: 'Supermarket weekly grocery basket',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'tx-4',
      type: 'expense',
      amountMinor: 180000, // ₹1,800
      category: 'Dining Out',
      date: day2Str,
      description: 'Dinner with friends at artisan bistro',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'tx-5',
      type: 'expense',
      amountMinor: 250000, // ₹2,500
      category: 'Utilities & Bills',
      date: todayStr,
      description: 'High-speed broadband fiber connection',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'tx-6',
      type: 'income',
      amountMinor: 1200000, // ₹12,000
      category: 'Freelance & Consulting',
      date: todayStr,
      description: 'Product UX advisory retainer',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const budgets: Record<string, MonthlyBudget> = {
    [currentMonth]: {
      month: currentMonth,
      budgetMinor: 4500000, // ₹45,000
      updatedAt: now.toISOString(),
    },
  };

  return { transactions, budgets };
}

function getStoredDemoData(): {
  transactions: ExpenseTransaction[];
  budgets: Record<string, MonthlyBudget>;
} {
  try {
    const rawT = localStorage.getItem(DEMO_EXPENSES_KEY);
    const rawB = localStorage.getItem(DEMO_BUDGETS_KEY);
    if (!rawT || !rawB) {
      const seed = getDemoSeedExpenses();
      localStorage.setItem(DEMO_EXPENSES_KEY, JSON.stringify(seed.transactions));
      localStorage.setItem(DEMO_BUDGETS_KEY, JSON.stringify(seed.budgets));
      return seed;
    }
    return {
      transactions: JSON.parse(rawT),
      budgets: JSON.parse(rawB),
    };
  } catch {
    return getDemoSeedExpenses();
  }
}

function saveDemoData(
  transactions: ExpenseTransaction[],
  budgets: Record<string, MonthlyBudget>
) {
  try {
    localStorage.setItem(DEMO_EXPENSES_KEY, JSON.stringify(transactions));
    localStorage.setItem(DEMO_BUDGETS_KEY, JSON.stringify(budgets));
    window.dispatchEvent(new CustomEvent(DEMO_EXPENSES_CHANGED));
  } catch (e) {
    console.error('Error saving demo expenses', e);
  }
}

export function subscribeUserExpenses(
  uid: string,
  onUpdate: (transactions: ExpenseTransaction[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoData().transactions);
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_EXPENSES_CHANGED, handler);
    return () => window.removeEventListener(DEMO_EXPENSES_CHANGED, handler);
  }

  const path = `users/${uid}/expenses`;
  const q = query(collection(db, 'users', uid, 'expenses'), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const list: ExpenseTransaction[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ExpenseTransaction, 'id'>),
      }));
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export function subscribeMonthlyBudgets(
  uid: string,
  onUpdate: (budgets: Record<string, MonthlyBudget>) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (uid === DEMO_UID) {
    const emit = () => onUpdate(getStoredDemoData().budgets);
    emit();
    const handler = () => emit();
    window.addEventListener(DEMO_EXPENSES_CHANGED, handler);
    return () => window.removeEventListener(DEMO_EXPENSES_CHANGED, handler);
  }

  const path = `users/${uid}/budgets`;
  return onSnapshot(
    collection(db, 'users', uid, 'budgets'),
    (snap) => {
      const map: Record<string, MonthlyBudget> = {};
      snap.docs.forEach((d) => {
        map[d.id] = { month: d.id, ...(d.data() as Omit<MonthlyBudget, 'month'>) };
      });
      onUpdate(map);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      onError?.(err);
    }
  );
}

export async function createExpense(
  uid: string,
  data: ExpenseFormData
): Promise<string> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const { transactions, budgets } = getStoredDemoData();
    const newId = `tx-${Date.now()}`;
    const newTx: ExpenseTransaction = {
      id: newId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    transactions.unshift(newTx);
    saveDemoData(transactions, budgets);
    return newId;
  }

  const path = `users/${uid}/expenses`;
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'expenses'), {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateExpense(
  uid: string,
  transactionId: string,
  data: Partial<ExpenseFormData>
): Promise<void> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const { transactions, budgets } = getStoredDemoData();
    const idx = transactions.findIndex((t) => t.id === transactionId);
    if (idx !== -1) {
      transactions[idx] = { ...transactions[idx], ...data, updatedAt: now };
      saveDemoData(transactions, budgets);
    }
    return;
  }

  const path = `users/${uid}/expenses/${transactionId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'expenses', transactionId), {
      ...data,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteExpense(
  uid: string,
  transactionId: string
): Promise<void> {
  if (uid === DEMO_UID) {
    const { transactions, budgets } = getStoredDemoData();
    const filtered = transactions.filter((t) => t.id !== transactionId);
    saveDemoData(filtered, budgets);
    return;
  }

  const path = `users/${uid}/expenses/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'expenses', transactionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function setMonthlyBudget(
  uid: string,
  month: string,
  budgetMinor: number
): Promise<void> {
  const now = new Date().toISOString();
  if (uid === DEMO_UID) {
    const { transactions, budgets } = getStoredDemoData();
    budgets[month] = {
      month,
      budgetMinor,
      updatedAt: now,
    };
    saveDemoData(transactions, budgets);
    return;
  }

  const path = `users/${uid}/budgets/${month}`;
  try {
    await setDoc(doc(db, 'users', uid, 'budgets', month), {
      budgetMinor,
      updatedAt: now,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}
