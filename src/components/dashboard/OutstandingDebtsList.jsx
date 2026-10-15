import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS, DEBT_DIRECTION } from '../../config/excelSchema';

/**
 * OutstandingDebtsList - List showing outstanding debts
 */
export default function OutstandingDebtsList({ debts, debtReturns, getRemainingDebt, limit = 5 }) {
  // Calculate remaining amounts and filter to only outstanding debts
  const outstandingDebts = debts
    .map((debt) => {
      const remaining = getRemainingDebt(debt);
      return {
        ...debt,
        remaining,
      };
    })
    .filter((debt) => debt.remaining > 0)
    .sort((a, b) => {
      // Sort by due date ascending (earliest first)
      const dateA = new Date(a[COLUMNS.DEBTS.DUE_DATE]);
      const dateB = new Date(b[COLUMNS.DEBTS.DUE_DATE]);
      return dateA - dateB;
    })
    .slice(0, limit);

  if (outstandingDebts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Outstanding Debts
        </h3>
        <div className="text-center py-8">
          <p className="text-surface-400 text-sm">
            No outstanding debts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Outstanding Debts
      </h3>
      <div className="space-y-3">
        {outstandingDebts.map((debt) => {
          const isLent = debt[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT;
          const progress = ((debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] - debt.remaining) / debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT]) * 100;

          return (
            <div
              key={debt[COLUMNS.DEBTS.DEBT_ID]}
              className="p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-surface-800 truncate">
                      {debt[COLUMNS.DEBTS.PERSON]}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isLent
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {debt[COLUMNS.DEBTS.DIRECTION]}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">
                    Due: {formatDate(debt[COLUMNS.DEBTS.DUE_DATE])}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className={`text-sm font-semibold ${isLent ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(debt.remaining)}
                  </p>
                  <p className="text-xs text-surface-500">
                    of {formatCurrency(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT])}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-surface-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isLent ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
