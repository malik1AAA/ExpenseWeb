import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { COLUMNS, DEBT_DIRECTION } from '../../config/excelSchema';

/**
 * DebtStatistics Component
 * Displays comprehensive debt statistics with separate sections for Lent and Borrowed
 */
export default function DebtStatistics({ debts = [], debtReturns = [] }) {
  // Create a map of debt returns by debt ID for O(1) lookups
  const debtReturnsByDebtId = useMemo(() => {
    const map = new Map();
    debtReturns.forEach((ret) => {
      const debtId = ret[COLUMNS.DEBT_RETURNS.DEBT_ID];
      if (!map.has(debtId)) {
        map.set(debtId, []);
      }
      map.get(debtId).push(ret);
    });
    return map;
  }, [debtReturns]);

  // Helper function to calculate totals for a specific direction (memoized)
  const calculateDebtStats = useMemo(() => {
    return (direction) => {
      const directionDebts = debts.filter(
        (d) => d[COLUMNS.DEBTS.DIRECTION] === direction
      );

      // Calculate total original amount
      const totalOriginal = directionDebts.reduce(
        (sum, d) => sum + parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0),
        0
      );

      // Calculate total returned using the map for O(1) lookups
      const totalReturned = directionDebts.reduce((sum, debt) => {
        const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
        const returns = debtReturnsByDebtId.get(debtId) || [];
        const debtReturnsSum = returns.reduce(
          (rSum, r) => rSum + parseFloat(r[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
          0
        );
        return sum + debtReturnsSum;
      }, 0);

      // Calculate outstanding (remaining)
      const outstanding = totalOriginal - totalReturned;

      // Count active debts (not fully paid)
      const activeCount = directionDebts.filter((debt) => {
        const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
        const returns = debtReturnsByDebtId.get(debtId) || [];
        const returned = returns.reduce(
          (sum, r) => sum + parseFloat(r[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
          0
        );
        const original = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);
        return returned < original;
      }).length;

      return {
        totalOriginal,
        totalReturned,
        outstanding,
        activeCount,
      };
    };
  }, [debts, debtReturnsByDebtId]);

  // Calculate statistics for Lent and Borrowed
  const lentStats = useMemo(
    () => calculateDebtStats(DEBT_DIRECTION.LENT),
    [calculateDebtStats]
  );
  
  const borrowedStats = useMemo(
    () => calculateDebtStats(DEBT_DIRECTION.BORROWED),
    [calculateDebtStats]
  );

  // Count overdue debts (memoized)
  const overdueCount = useMemo(() => {
    const now = new Date();
    return debts.filter((debt) => {
      const dueDate = debt[COLUMNS.DEBTS.DUE_DATE];
      if (!dueDate) return false;

      const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
      const returns = debtReturnsByDebtId.get(debtId) || [];
      const returned = returns.reduce(
        (sum, r) => sum + parseFloat(r[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
        0
      );
      const original = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);

      // Debt is overdue if not fully paid and past due date
      return returned < original && new Date(dueDate) < now;
    }).length;
  }, [debts, debtReturnsByDebtId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* You Should Receive (Lent) */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-green-50">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">
            You Should Receive
          </h3>
        </div>

        <div className="space-y-4">
          {/* Money Lent */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-surface-500" />
              <span className="text-sm text-surface-600">Money Lent</span>
            </div>
            <span className="text-lg font-semibold text-surface-900">
              {formatCurrency(lentStats.totalOriginal)}
            </span>
          </div>

          {/* Money Returned */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-surface-600">Money Returned</span>
            </div>
            <span className="text-lg font-semibold text-green-600">
              {formatCurrency(lentStats.totalReturned)}
            </span>
          </div>

          {/* Outstanding Receivable */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-surface-600">Outstanding</span>
            </div>
            <span className="text-xl font-bold text-orange-600">
              {formatCurrency(lentStats.outstanding)}
            </span>
          </div>

          {/* Active Debts Count */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-surface-600">Active Debts</span>
            <span className="text-lg font-semibold text-surface-900">
              {lentStats.activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* You Should Pay (Borrowed) */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-red-50">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900">
            You Should Pay
          </h3>
        </div>

        <div className="space-y-4">
          {/* Money Borrowed */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-surface-500" />
              <span className="text-sm text-surface-600">Money Borrowed</span>
            </div>
            <span className="text-lg font-semibold text-surface-900">
              {formatCurrency(borrowedStats.totalOriginal)}
            </span>
          </div>

          {/* Money Paid Back */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-surface-600">Money Paid Back</span>
            </div>
            <span className="text-lg font-semibold text-red-600">
              {formatCurrency(borrowedStats.totalReturned)}
            </span>
          </div>

          {/* Outstanding Payable */}
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-surface-600">Outstanding</span>
            </div>
            <span className="text-xl font-bold text-orange-600">
              {formatCurrency(borrowedStats.outstanding)}
            </span>
          </div>

          {/* Active Debts Count */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-surface-600">Active Debts</span>
            <span className="text-lg font-semibold text-surface-900">
              {borrowedStats.activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Overdue Debts Alert (if any) */}
      {overdueCount > 0 && (
        <div className="lg:col-span-2 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">
                {overdueCount} Overdue {overdueCount === 1 ? 'Debt' : 'Debts'}
              </p>
              <p className="text-xs text-red-700 mt-1">
                You have debts that are past their due date
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
