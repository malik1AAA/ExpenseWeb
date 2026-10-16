import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS } from '../../config/excelSchema';

/**
 * ReportExpenseTable - Read-only table showing expenses for the report period
 */
export default function ReportExpenseTable({ expenses = [], getCategoryName }) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Expense Details
        </h3>
        <div className="text-center py-8">
          <p className="text-surface-400 text-sm">
            No expenses found for this period
          </p>
        </div>
      </div>
    );
  }

  // Sort by date descending
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a[COLUMNS.EXPENSES.DATE]);
    const dateB = new Date(b[COLUMNS.EXPENSES.DATE]);
    return dateB - dateA;
  });

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Expense Details ({expenses.length} expenses)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Payment Method
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {sortedExpenses.map((expense) => (
              <tr key={expense[COLUMNS.EXPENSES.EXPENSE_ID]} className="hover:bg-surface-50 transition-colors">
                <td className="px-4 py-3 text-sm text-surface-900 whitespace-nowrap">
                  {formatDate(expense[COLUMNS.EXPENSES.DATE])}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900 font-medium">
                  {expense[COLUMNS.EXPENSES.DESCRIPTION]}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {getCategoryName(expense[COLUMNS.EXPENSES.CATEGORY])}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-surface-900 text-right font-semibold whitespace-nowrap">
                  {formatCurrency(expense[COLUMNS.EXPENSES.AMOUNT])}
                </td>
                <td className="px-4 py-3 text-sm text-surface-600">
                  {expense[COLUMNS.EXPENSES.PAYMENT_METHOD] || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
