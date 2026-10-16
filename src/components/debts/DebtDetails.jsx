import { Modal } from '../common';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS, DEBT_DIRECTION } from '../../config/excelSchema';
import { User, Calendar, DollarSign, Clock, FileText, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * DebtDetails - Modal component showing debt details and transaction history
 */
export default function DebtDetails({ 
  isOpen, 
  onClose, 
  debt,
  debtReturns = []
}) {
  if (!debt) return null;

  // Calculate total returned and remaining
  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const returns = debtReturns.filter(
    ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId
  );
  
  const totalReturned = returns.reduce(
    (sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 
    0
  );
  
  const originalAmount = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);
  const remaining = originalAmount - totalReturned;

  // Determine status
  const getStatus = () => {
    if (remaining <= 0) return { label: 'Paid', color: 'green' };
    if (totalReturned > 0 && remaining > 0) return { label: 'Partial', color: 'blue' };
    
    const dueDate = debt[COLUMNS.DEBTS.DUE_DATE] ? new Date(debt[COLUMNS.DEBTS.DUE_DATE]) : null;
    const now = new Date();
    if (totalReturned === 0 && dueDate && dueDate < now) return { label: 'Overdue', color: 'red' };
    
    return { label: 'Active', color: 'gray' };
  };

  const status = getStatus();
  const isLent = debt[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT;

  // Build transaction history
  const transactions = [
    {
      date: debt[COLUMNS.DEBTS.DATE],
      type: isLent ? 'Lent' : 'Borrowed',
      amount: originalAmount,
      notes: debt[COLUMNS.DEBTS.NOTES] || '',
      isOriginal: true,
    },
    ...returns.map(ret => ({
      date: ret[COLUMNS.DEBT_RETURNS.DATE],
      type: 'Returned',
      amount: parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
      notes: ret[COLUMNS.DEBT_RETURNS.NOTES] || '',
      isOriginal: false,
    }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const statusColors = {
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Debt Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Debt Information Card */}
        <div className="bg-surface-50 rounded-lg p-6 border border-surface-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-surface-400 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 mb-1">Person</p>
                <p className="text-sm font-semibold text-surface-900">
                  {debt[COLUMNS.DEBTS.PERSON]}
                </p>
              </div>
            </div>

            {/* Direction */}
            <div className="flex items-start gap-3">
              {isLent ? (
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className="text-xs text-surface-500 mb-1">Direction</p>
                <p className={`text-sm font-semibold ${isLent ? 'text-green-700' : 'text-red-700'}`}>
                  {debt[COLUMNS.DEBTS.DIRECTION]}
                </p>
              </div>
            </div>

            {/* Original Amount */}
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-surface-400 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 mb-1">Original Amount</p>
                <p className="text-sm font-semibold text-surface-900">
                  {formatCurrency(originalAmount)}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-surface-400 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 mb-1">Date</p>
                <p className="text-sm font-semibold text-surface-900">
                  {formatDate(debt[COLUMNS.DEBTS.DATE])}
                </p>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-surface-400 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 mb-1">Due Date</p>
                <p className="text-sm font-semibold text-surface-900">
                  {debt[COLUMNS.DEBTS.DUE_DATE] ? formatDate(debt[COLUMNS.DEBTS.DUE_DATE]) : 'Not set'}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                <div className={`w-2 h-2 rounded-full ${
                  status.color === 'green' ? 'bg-green-500' :
                  status.color === 'blue' ? 'bg-blue-500' :
                  status.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
              <div>
                <p className="text-xs text-surface-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status.color]}`}>
                  {status.label}
                </span>
              </div>
            </div>

            {/* Current Returned Amount */}
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 mb-1">Total Returned</p>
                <p className="text-sm font-semibold text-blue-700">
                  {formatCurrency(totalReturned)}
                </p>
              </div>
            </div>

            {/* Remaining Amount */}
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-surface-400 mt-0.5" />
              <div>
                <p className="text-xs text-surface-500 mb-1">Remaining</p>
                <p className={`text-sm font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {debt[COLUMNS.DEBTS.NOTES] && (
            <div className="mt-4 pt-4 border-t border-surface-200">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-surface-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-surface-500 mb-1">Notes</p>
                  <p className="text-sm text-surface-700">{debt[COLUMNS.DEBTS.NOTES]}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-lg font-semibold text-surface-900 mb-4">
            Transaction History
          </h3>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-200" />

            {/* Transactions */}
            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const isLast = index === transactions.length - 1;
                
                return (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      transaction.isOriginal 
                        ? isLent ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'
                        : 'bg-blue-100 border-2 border-blue-500'
                    }`}>
                      {transaction.isOriginal ? (
                        isLent ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )
                      ) : (
                        <DollarSign className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    {/* Transaction content */}
                    <div className="flex-1 bg-white border border-surface-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-surface-500 mb-1">
                            {formatDate(transaction.date)}
                          </p>
                          <p className={`text-sm font-semibold ${
                            transaction.isOriginal 
                              ? isLent ? 'text-green-700' : 'text-red-700'
                              : 'text-blue-700'
                          }`}>
                            {transaction.type}
                          </p>
                        </div>
                        <p className={`text-lg font-bold ${
                          transaction.isOriginal 
                            ? isLent ? 'text-green-600' : 'text-red-600'
                            : 'text-blue-600'
                        }`}>
                          {transaction.isOriginal ? '' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      {transaction.notes && (
                        <p className="text-xs text-surface-600 mt-2 pt-2 border-t border-surface-100">
                          {transaction.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Remaining balance */}
              {remaining > 0 && (
                <div className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-red-100 border-2 border-red-500">
                    <DollarSign className="w-5 h-5 text-red-600" />
                  </div>

                  {/* Remaining content */}
                  <div className="flex-1 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-red-600 mb-1 font-medium">
                          Current Balance
                        </p>
                        <p className="text-sm font-semibold text-red-700">
                          Remaining
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {remaining <= 0 && (
                <div className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-green-100 border-2 border-green-500">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>

                  {/* Paid content */}
                  <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <p className="text-lg font-bold text-green-700">
                        ✓ Fully Paid
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
