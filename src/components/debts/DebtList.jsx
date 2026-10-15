import { CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import EmptyState from '../common/EmptyState';
import { useFinance } from '../../hooks/useFinance';
import { COLUMNS, DEBT_DIRECTION } from '../../config/excelSchema';

const COL = COLUMNS.DEBTS;

/**
 * DebtList - List of active debts
 */
function DebtList({ debts = [] }) {
  const { getRemainingDebt } = useFinance();
  const hasData = debts && debts.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200">
          <h3 className="text-lg font-semibold text-surface-800">Active Debts</h3>
        </div>
        <EmptyState
          icon={CreditCard}
          title="No debts tracked"
          description="Keep track of your loans, credit cards, and money owed to others. Add your first debt to get started."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-200">
        <h3 className="text-lg font-semibold text-surface-800">Active Debts</h3>
      </div>
      <div className="divide-y divide-surface-100">
        {debts.map((debt) => {
          const remaining = getRemainingDebt(debt);
          const progress = ((debt[COL.ORIGINAL_AMOUNT] - remaining) / debt[COL.ORIGINAL_AMOUNT]) * 100;
          const isLent = debt[COL.DIRECTION] === DEBT_DIRECTION.LENT;
          
          return (
            <div key={debt[COL.DEBT_ID]} className="p-4 hover:bg-surface-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-surface-800">
                      {debt[COL.PERSON]}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isLent 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {debt[COL.DIRECTION]}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Due: {formatDate(debt[COL.DUE_DATE], 'MMM dd, yyyy')} • {debt[COL.DEBT_CATEGORY]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-surface-800">
                    {formatCurrency(remaining)}
                  </p>
                  <p className="text-xs text-surface-500">
                    of {formatCurrency(debt[COL.ORIGINAL_AMOUNT])}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 w-full bg-surface-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isLent ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {debt[COL.NOTES] && (
                <p className="text-xs text-surface-400 mt-2 italic">
                  {debt[COL.NOTES]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DebtList;
