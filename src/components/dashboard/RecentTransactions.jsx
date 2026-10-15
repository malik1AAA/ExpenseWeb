import { formatRelativeDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { getCategoryName } from '../../data/sampleData';
import { COLUMNS } from '../../config/excelSchema';

const COL = COLUMNS.EXPENSES;

/**
 * RecentTransactions - Dashboard recent transactions list
 */
function RecentTransactions({ transactions = [] }) {
  const hasData = transactions && transactions.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Recent Transactions
        </h3>
        <div className="text-center py-8">
          <p className="text-surface-400 text-sm">
            No transactions yet. Start by importing your Excel data or adding expenses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Recent Transactions
      </h3>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction[COL.EXPENSE_ID]}
            className="flex items-center justify-between p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-lg">↓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-surface-800">
                  {transaction[COL.DESCRIPTION]}
                </p>
                <p className="text-xs text-surface-500">
                  {formatRelativeDate(transaction[COL.DATE])} • {getCategoryName(transaction[COL.CATEGORY])}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-red-600">
              -{formatCurrency(transaction[COL.AMOUNT])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentTransactions;
