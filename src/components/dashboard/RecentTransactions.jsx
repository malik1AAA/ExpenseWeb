import { formatRelativeDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * RecentTransactions - Dashboard recent transactions list
 */
function RecentTransactions({ transactions = [] }) {
  const hasData = transactions && transactions.length > 0;

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Recent Transactions
      </h3>
      
      {hasData ? (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className="text-lg">
                    {transaction.type === 'income' ? '↑' : '↓'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-800">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-surface-500">
                    {formatRelativeDate(transaction.date)}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-surface-400 text-sm">
            No transactions yet. Start by importing your Excel data or adding expenses.
          </p>
        </div>
      )}
    </div>
  );
}

export default RecentTransactions;
