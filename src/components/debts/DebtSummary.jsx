import { formatCurrency } from '../../utils/currencyUtils';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { COLUMNS, DEBT_DIRECTION } from '../../config/excelSchema';

/**
 * DebtSummary - Summary cards for debts page
 */
export default function DebtSummary({ 
  debts = [],
  debtReturns = []
}) {
  // Calculate totals for lent debts
  const lentDebts = debts.filter(d => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT);
  const lentOriginal = lentDebts.reduce((sum, d) => sum + parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0), 0);
  const lentReturned = debtReturns
    .filter(ret => lentDebts.some(d => d[COLUMNS.DEBTS.DEBT_ID] === ret[COLUMNS.DEBT_RETURNS.DEBT_ID]))
    .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  const lentRemaining = lentOriginal - lentReturned;

  // Calculate totals for borrowed debts
  const borrowedDebts = debts.filter(d => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.BORROWED);
  const borrowedOriginal = borrowedDebts.reduce((sum, d) => sum + parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0), 0);
  const borrowedReturned = debtReturns
    .filter(ret => borrowedDebts.some(d => d[COLUMNS.DEBTS.DEBT_ID] === ret[COLUMNS.DEBT_RETURNS.DEBT_ID]))
    .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  const borrowedRemaining = borrowedOriginal - borrowedReturned;

  // Count overdue debts
  const now = new Date();
  const overdueCount = debts.filter(d => {
    const debtId = d[COLUMNS.DEBTS.DEBT_ID];
    const returned = debtReturns
      .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
      .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
    const remaining = parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0) - returned;
    if (remaining <= 0) return false;
    const dueDate = new Date(d[COLUMNS.DEBTS.DUE_DATE]);
    return returned === 0 && dueDate < now;
  }).length;

  const summaryCards = [
    {
      title: 'Total Lent',
      value: formatCurrency(lentOriginal),
      subtitle: `${formatCurrency(lentRemaining)} remaining`,
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Total Borrowed',
      value: formatCurrency(borrowedOriginal),
      subtitle: `${formatCurrency(borrowedRemaining)} remaining`,
      icon: TrendingDown,
      color: 'red',
    },
    {
      title: 'Net Position',
      value: formatCurrency(lentRemaining - borrowedRemaining),
      subtitle: lentRemaining > borrowedRemaining ? 'You are owed' : 'You owe',
      icon: DollarSign,
      color: 'blue',
    },
    {
      title: 'Overdue',
      value: overdueCount.toString(),
      subtitle: overdueCount === 1 ? 'debt' : 'debts',
      icon: AlertCircle,
      color: overdueCount > 0 ? 'red' : 'green',
    },
  ];

  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${colorClasses[card.color]}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{card.value}</p>
            <p className="text-sm font-medium text-surface-700 mt-1">{card.title}</p>
            <p className="text-xs text-surface-500 mt-0.5">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
