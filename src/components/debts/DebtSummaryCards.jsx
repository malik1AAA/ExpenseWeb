import { CreditCard, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * DebtSummaryCards - Summary cards for debts page
 */
function DebtSummaryCards({ totalDebt = 0, dueThisMonth = 0, paidOff = 0 }) {
  const cards = [
    {
      icon: CreditCard,
      value: formatCurrency(totalDebt),
      label: 'Total Debt',
      color: 'red',
    },
    {
      icon: Clock,
      value: formatCurrency(dueThisMonth),
      label: 'Due This Month',
      color: 'amber',
    },
    {
      icon: CheckCircle2,
      value: paidOff.toString(),
      label: 'Paid Off',
      color: 'green',
    },
  ];

  const colorClasses = {
    red: 'bg-red-50',
    amber: 'bg-amber-50',
    green: 'bg-green-50',
  };

  const iconColorClasses = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClasses[card.color]}`}>
              <card.icon className={`w-5 h-5 ${iconColorClasses[card.color]}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{card.value}</p>
              <p className="text-sm text-surface-500">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DebtSummaryCards;
