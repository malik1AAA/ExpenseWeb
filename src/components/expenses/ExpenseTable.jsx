import { Plus } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { getCategoryName } from '../../data/sampleData';
import EmptyState from '../common/EmptyState';
import { COLUMNS } from '../../config/excelSchema';

const COL = COLUMNS.EXPENSES;

/**
 * ExpenseTable - Table displaying expense list
 */
function ExpenseTable({ expenses = [], onEdit, onDelete }) {
  const hasData = expenses && expenses.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <EmptyState
          icon={Plus}
          title="No expenses yet"
          description="Start tracking your expenses by adding them manually or importing from an Excel file."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {expenses.map((expense) => {
              const categoryName = getCategoryName(expense[COL.CATEGORY]);
              return (
                <tr key={expense[COL.EXPENSE_ID]} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-surface-600">
                    {formatDate(expense[COL.DATE], 'MMM dd')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-surface-800">
                    {expense[COL.DESCRIPTION]}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-surface-800 text-right">
                    {formatCurrency(expense[COL.AMOUNT])}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-600">
                    {expense[COL.PAYMENT_METHOD] || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(expense)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(expense[COL.EXPENSE_ID])}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExpenseTable;
