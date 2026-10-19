import { useMemo, useCallback } from 'react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS, DEBT_DIRECTION } from '../../config/excelSchema';
import { Edit, Trash2, DollarSign } from 'lucide-react';
import { SortableHeader } from '../common';
import { useSortableTable } from '../../hooks/useSortableTable';

/**
 * DebtTable - Table displaying debts with calculated fields and interactive sorting
 */
export default function DebtTable({ 
  debts = [], 
  debtReturns = [],
  direction = 'all',
  onEdit, 
  onDelete,
  onRecordReturn,
  onViewDetails
}) {
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

  // Calculate remaining amount for a debt (memoized)
  const calculateRemaining = useCallback(
    (debt) => {
      const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
      const returns = debtReturnsByDebtId.get(debtId) || [];
      const totalReturned = returns.reduce(
        (sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
        0
      );
      
      return {
        totalReturned,
        remaining: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] - totalReturned,
      };
    },
    [debtReturnsByDebtId]
  );

  // Determine debt status
  const getStatus = useCallback((debt, totalReturned, remaining) => {
    if (remaining <= 0) return 'Paid';
    if (totalReturned > 0 && remaining > 0) return 'Partial';
    
    const dueDate = new Date(debt[COLUMNS.DEBTS.DUE_DATE]);
    const now = new Date();
    if (totalReturned === 0 && dueDate < now) return 'Overdue';
    
    return 'Active';
  }, []);

  // Enrich debts with calculated fields for sorting
  const enrichedDebts = useMemo(() => {
    return debts.map(debt => {
      const { totalReturned, remaining } = calculateRemaining(debt);
      const status = getStatus(debt, totalReturned, remaining);
      return {
        ...debt,
        _totalReturned: totalReturned,
        _remaining: remaining,
        _status: status,
      };
    });
  }, [debts, calculateRemaining, getStatus]);

  // Use sortable table hook with default sort by due date ascending
  const { handleSort, getSortState, sortedData: sortedDebts } = useSortableTable(
    enrichedDebts,
    COLUMNS.DEBTS.DUE_DATE,
    'asc'
  );

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Partial':
        return 'bg-blue-100 text-blue-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      case 'Active':
        return 'bg-surface-100 text-surface-700';
      default:
        return 'bg-surface-100 text-surface-700';
    }
  }, []);

  if (sortedDebts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
        <p className="text-surface-500">
          {direction === 'all' 
            ? 'No debts found' 
            : `No ${direction.toLowerCase()} debts found`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <SortableHeader
                label="Person"
                field={COLUMNS.DEBTS.PERSON}
                sortState={getSortState(COLUMNS.DEBTS.PERSON)}
                onSort={handleSort}
                align="left"
              />
              <SortableHeader
                label="Original Amount"
                field={COLUMNS.DEBTS.ORIGINAL_AMOUNT}
                sortState={getSortState(COLUMNS.DEBTS.ORIGINAL_AMOUNT)}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="Date"
                field={COLUMNS.DEBTS.DATE}
                sortState={getSortState(COLUMNS.DEBTS.DATE)}
                onSort={handleSort}
                align="left"
              />
              <SortableHeader
                label="Due Date"
                field={COLUMNS.DEBTS.DUE_DATE}
                sortState={getSortState(COLUMNS.DEBTS.DUE_DATE)}
                onSort={handleSort}
                align="left"
              />
              <SortableHeader
                label="Category"
                field={COLUMNS.DEBTS.DEBT_CATEGORY}
                sortState={getSortState(COLUMNS.DEBTS.DEBT_CATEGORY)}
                onSort={handleSort}
                align="left"
              />
              <SortableHeader
                label="Returned/Paid"
                field="_totalReturned"
                sortState={getSortState('_totalReturned')}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="Remaining"
                field="_remaining"
                sortState={getSortState('_remaining')}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="Status"
                field="_status"
                sortState={getSortState('_status')}
                onSort={handleSort}
                align="center"
              />
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {sortedDebts.map((debt) => {
              const totalReturned = debt._totalReturned;
              const remaining = debt._remaining;
              const status = debt._status;
              const isLent = debt[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT;

              return (
                <tr 
                  key={debt[COLUMNS.DEBTS.DEBT_ID]} 
                  className="hover:bg-surface-50 transition-colors cursor-pointer"
                  onClick={() => onViewDetails && onViewDetails(debt)}
                >
                  <td className="px-4 py-3 text-sm text-surface-900 font-medium">
                    <div className="flex items-center gap-2">
                      {debt[COLUMNS.DEBTS.PERSON]}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isLent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {debt[COLUMNS.DEBTS.DIRECTION]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-900 text-right font-semibold">
                    {formatCurrency(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT])}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-600 whitespace-nowrap">
                    {formatDate(debt[COLUMNS.DEBTS.DATE])}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-600 whitespace-nowrap">
                    {formatDate(debt[COLUMNS.DEBTS.DUE_DATE])}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-600">
                    {debt[COLUMNS.DEBTS.DEBT_CATEGORY]}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-900 text-right">
                    {formatCurrency(totalReturned)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(remaining)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-1">
                      {remaining > 0 && onRecordReturn && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecordReturn(debt);
                          }}
                          className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                          title="Record Return"
                        >
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(debt);
                        }}
                        className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-surface-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(debt);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
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
