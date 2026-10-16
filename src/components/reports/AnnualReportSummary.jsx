import { formatCurrency } from '../../utils/currencyUtils';
import { DollarSign, TrendingUp, ArrowUp, ArrowDown, Award } from 'lucide-react';

/**
 * AnnualReportSummary - Summary statistics for annual report
 */
export default function AnnualReportSummary({ 
  annualTotal = 0, 
  averageMonthly = 0, 
  highestMonth = null,
  lowestMonth = null,
  highestCategory = null,
  getMonthName,
  getCategoryName
}) {
  const stats = [
    {
      label: 'Annual Total Spending',
      value: formatCurrency(annualTotal),
      icon: DollarSign,
      color: 'blue',
    },
    {
      label: 'Average Monthly Spending',
      value: formatCurrency(averageMonthly),
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Highest Spending Month',
      value: highestMonth ? `${getMonthName(highestMonth.month)} (${formatCurrency(highestMonth.total)})` : 'N/A',
      icon: ArrowUp,
      color: 'purple',
    },
    {
      label: 'Lowest Spending Month',
      value: lowestMonth ? `${getMonthName(lowestMonth.month)} (${formatCurrency(lowestMonth.total)})` : 'N/A',
      icon: ArrowDown,
      color: 'amber',
    },
    {
      label: 'Highest Spending Category',
      value: highestCategory ? `${getCategoryName(highestCategory.category)} (${formatCurrency(highestCategory.total)})` : 'N/A',
      icon: Award,
      color: 'red',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-600 mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-surface-900 truncate">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
