import { formatCurrency } from '../../utils/currencyUtils';
import { DollarSign, Receipt, TrendingUp, ArrowUpRight } from 'lucide-react';

/**
 * ReportSummary - Summary statistics for the report period
 */
export default function ReportSummary({ total = 0, count = 0, average = 0, largest = 0 }) {
  const stats = [
    {
      label: 'Total Spending',
      value: formatCurrency(total),
      icon: DollarSign,
      color: 'blue',
    },
    {
      label: 'Number of Expenses',
      value: count.toString(),
      icon: Receipt,
      color: 'green',
    },
    {
      label: 'Average Daily Expense',
      value: formatCurrency(average),
      icon: TrendingUp,
      color: 'purple',
    },
    {
      label: 'Largest Expense',
      value: formatCurrency(largest),
      icon: ArrowUpRight,
      color: 'amber',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-surface-900 truncate">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
