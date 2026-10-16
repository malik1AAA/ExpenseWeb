import { useMemo } from 'react';
import { formatCurrency } from '../../utils/currencyUtils';
import { COLUMNS } from '../../config/excelSchema';
import { Receipt, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';

/**
 * ExpenseSummary - Summary statistics for filtered expenses
 * Displays count, total, average, and largest expense
 */
export default function ExpenseSummary({ expenses = [] }) {
  // Memoize all calculations
  const stats = useMemo(() => {
    const count = expenses.length;

    const total = expenses.reduce((sum, expense) => {
      const amount = parseFloat(expense[COLUMNS.EXPENSES.AMOUNT]) || 0;
      return sum + amount;
    }, 0);

    const average = count > 0 ? total / count : 0;

    const largest = expenses.reduce((max, expense) => {
      const amount = parseFloat(expense[COLUMNS.EXPENSES.AMOUNT]) || 0;
      return amount > max ? amount : max;
    }, 0);

    return [
      {
        label: 'Filtered Expenses',
        value: count.toString(),
        icon: Receipt,
        color: 'blue',
      },
      {
        label: 'Total Amount',
        value: formatCurrency(total),
        icon: DollarSign,
        color: 'green',
      },
      {
        label: 'Average Expense',
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
  }, [expenses]);

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-surface-600 mb-1 truncate">
                {stat.label}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-surface-900 truncate">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
