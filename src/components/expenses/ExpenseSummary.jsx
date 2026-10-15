import { formatCurrency } from '../../utils/currencyUtils';

/**
 * ExpenseSummary - Summary statistics for filtered expenses
 */
export default function ExpenseSummary({ expenses }) {
  const count = expenses.length;
  
  const total = expenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.Amount) || 0;
    return sum + amount;
  }, 0);

  const average = count > 0 ? total / count : 0;

  const largest = expenses.reduce((max, expense) => {
    const amount = parseFloat(expense.Amount) || 0;
    return amount > max ? amount : max;
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-surface-600 mb-1">Filtered Expenses</p>
          <p className="text-2xl font-bold text-surface-900">{count}</p>
        </div>
        <div>
          <p className="text-sm text-surface-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-surface-900">{formatCurrency(total)}</p>
        </div>
        <div>
          <p className="text-sm text-surface-600 mb-1">Average Expense</p>
          <p className="text-2xl font-bold text-surface-900">{formatCurrency(average)}</p>
        </div>
        <div>
          <p className="text-sm text-surface-600 mb-1">Largest Expense</p>
          <p className="text-2xl font-bold text-surface-900">{formatCurrency(largest)}</p>
        </div>
      </div>
    </div>
  );
}
