import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS, DEBT_DIRECTION } from '../../config/excelSchema';
import { Edit, Trash2 } from 'lucide-react';

/**
 * DebtTable - Table displaying debts with calculated fields
 */
export default function DebtTable({ 
  debts = [], 
  debtReturns = [],
  direction = 'all',
  onEdit, 
  onDelete 
}) {
  // Calculate remaining amount for a debt
  const calculateRemaining = (debt) => {
    const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
    const totalReturned = debtReturns
      .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
      .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
    
    return {
      totalReturned,
      remaining: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] - totalReturned,
    };
  };

  // Determine debt status
  const getStatus = (debt, totalReturned, remaining) => {
    if (remaining <= 0) return 'Paid';
    if (totalReturned > 0 && remaining > 0) return 'Partial';
    
    const dueDate = new Date(debt[COLUMNS.DEBTS.DUE_DATE]);
    const now = new Date();
    if (totalReturned === 0 && dueDate < now) return 'Overdue';
    
    return 'Active';
  };

  // Filter debts by direction
  const filteredDebts = direction === 'all' 
    ? debts 
    : debts.filter(d => d[COLUMNS.DEBTS.DIRECTION] === direction);

  // Sort by due date (earliest first)
  const sortedDebts = [...filteredDebts].sort((a, b) => {
    const dateA = new Date(a[COLUMNS.DEBTS.DUE_DATE]);
    const dateB = new Date(b[COLUMNS.DEBTS.DUE_DATE]);
    return dateA - dateB;
  });

  const getStatusColor = (status) => {
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
  };

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
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Person
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Original Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Returned/Paid
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Remaining
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {sortedDebts.map((debt) => {
              const { totalReturned, remaining } = calculateRemaining(debt);
              const status = getStatus(debt, totalReturned, remaining);
              const isLent = debt[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT;

              return (
                <tr key={debt[COLUMNS.DEBTS.DEBT_ID]} className="hover:bg-surface-50 transition-colors">
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
                      <button
                        onClick={() => onEdit(debt)}
                        className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-surface-600" />
                      </button>
                      <button
                        onClick={() => onDelete(debt)}
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
