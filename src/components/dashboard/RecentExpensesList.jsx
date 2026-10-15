import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS } from '../../config/excelSchema';

/**
 * RecentExpensesList - List showing recent expenses
 */
export default function RecentExpensesList({ expenses, getCategoryName, limit = 5 }) {
  // Sort by date descending and take top N
  const recentExpenses = [...expenses]
    .sort((a, b) => {
      const dateA = new Date(a[COLUMNS.EXPENSES.DATE]);
      const dateB = new Date(b[COLUMNS.EXPENSES.DATE]);
      return dateB - dateA;
    })
    .slice(0, limit);

  if (recentExpenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Recent Expenses
        </h3>
        <div className="text-center py-8">
          <p className="text-surface-400 text-sm">
            No expenses found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Recent Expenses
      </h3>
      <div className="space-y-3">
        {recentExpenses.map((expense) => (
          <div
            key={expense[COLUMNS.EXPENSES.EXPENSE_ID]}
            className="flex items-center justify-between p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">
                {expense[COLUMNS.EXPENSES.DESCRIPTION]}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-surface-500">
                  {formatDate(expense[COLUMNS.EXPENSES.DATE])}
                </span>
                <span className="text-xs text-surface-400">•</span>
                <span className="text-xs text-surface-500">
                  {getCategoryName(expense[COLUMNS.EXPENSES.CATEGORY])}
                </span>
              </div>
            </div>
            <div className="text-right ml-4">
              <p className="text-sm font-semibold text-red-600">
                -{formatCurrency(expense[COLUMNS.EXPENSES.AMOUNT])}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
