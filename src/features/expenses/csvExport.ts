import { ExpenseTransaction } from './schema';
import { fromMinorUnits } from '../../lib/money';

export function exportExpensesToCSV(
  transactions: ExpenseTransaction[],
  currency = 'INR',
  filename = 'kurashii-expenses.csv'
) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency'];
  const rows = transactions.map((t) => {
    const formattedAmount = (fromMinorUnits(t.amountMinor)).toFixed(2);
    const cleanDesc = `"${(t.description || '').replace(/"/g, '""')}"`;
    return [t.date, t.type.toUpperCase(), t.category, cleanDesc, formattedAmount, currency];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
