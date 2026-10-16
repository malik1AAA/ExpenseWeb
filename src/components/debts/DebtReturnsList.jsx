import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS } from '../../config/excelSchema';
import { Trash2 } from 'lucide-react';

/**
 * DebtReturnsList - List of returns/payments for a specific debt
 */
export default function DebtReturnsList({ 
  debtReturns = [],
  debtId,
  onDeleteReturn
}) {
  // Filter returns for this specific debt
  const returnsForDebt = debtReturns
    .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
    .sort((a, b) => {
      const dateA = new Date(a[COLUMNS.DEBT_RETURNS.DATE]);
      const dateB = new Date(b[COLUMNS.DEBT_RETURNS.DATE]);
      return dateB - dateA; // Most recent first
    });

  if (returnsForDebt.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-surface-500 text-sm">No payments recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-surface-700 mb-3">Payment History</h4>
      <div className="space-y-2">
        {returnsForDebt.map((ret) => (
          <div 
            key={ret[COLUMNS.DEBT_RETURNS.RETURN_ID]} 
            className="flex items-center justify-between p-3 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-surface-900">
                    {formatCurrency(ret[COLUMNS.DEBT_RETURNS.AMOUNT])}
                  </p>
                  <p className="text-xs text-surface-500">
                    {formatDate(ret[COLUMNS.DEBT_RETURNS.DATE])}
                  </p>
                </div>
                {ret[COLUMNS.DEBT_RETURNS.NOTES] && (
                  <p className="text-xs text-surface-600 italic">
                    {ret[COLUMNS.DEBT_RETURNS.NOTES]}
                  </p>
                )}
              </div>
            </div>
            {onDeleteReturn && (
              <button
                onClick={() => onDeleteReturn(ret[COLUMNS.DEBT_RETURNS.RETURN_ID])}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete payment"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
