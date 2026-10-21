import { formatCurrency } from '../../utils/currencyUtils';
import { DollarSign, TrendingUp, ArrowUp, ArrowDown, Award, Calendar, Receipt } from 'lucide-react';

/**
 * AnnualReportSummary - Summary statistics for annual report
 * Displays key metrics with clear labels, values, and explanatory subtitles
 */
export default function AnnualReportSummary({ 
  year,
  annualTotal = 0, 
  annualCount = 0,
  averageDaily = 0, 
  highestMonth = null,
  lowestMonth = null,
  highestCategory = null,
  getMonthName,
  getCategoryName
}) {
  // Helper to format month display
  const formatMonthDisplay = (monthData) => {
    if (!monthData) return { name: 'N/A', amount: 'Rs. 0' };
    return {
      name: getMonthName(monthData.month),
      amount: formatCurrency(monthData.total),
    };
  };

  const highestMonthDisplay = formatMonthDisplay(highestMonth);
  const lowestMonthDisplay = formatMonthDisplay(lowestMonth);

  const stats = [
    {
      title: 'Total Annual Expenses',
      value: formatCurrency(annualTotal),
      subtitle: `Total recorded expenses for ${year}`,
      icon: DollarSign,
      color: 'blue',
    },
    {
      title: 'Average Daily Expense',
      value: formatCurrency(averageDaily),
      subtitle: `Total annual expenses divided by ${year === new Date().getFullYear() ? 'days elapsed' : 'days in year'}`,
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Highest Spending Month',
      value: highestMonthDisplay.amount,
      subtitle: highestMonth ? highestMonthDisplay.name : 'No data available',
      icon: ArrowUp,
      color: 'purple',
    },
    {
      title: 'Lowest Spending Month',
      value: lowestMonthDisplay.amount,
      subtitle: lowestMonth ? `${lowestMonthDisplay.name} (excluding zero-spending months)` : 'No data available',
      icon: ArrowDown,
      color: 'amber',
    },
    {
      title: 'Highest Spending Category',
      value: highestCategory ? formatCurrency(highestCategory.total) : 'Rs. 0',
      subtitle: highestCategory ? getCategoryName(highestCategory.category) : 'No data available',
      icon: Award,
      color: 'red',
    },
    {
      title: 'Total Transactions',
      value: annualCount.toString(),
      subtitle: `Number of expense records in ${year}`,
      icon: Receipt,
      color: 'indigo',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  // Check if there's any data
  const hasData = annualCount > 0;

  return (
    <div className="space-y-4">
      {/* Year Header */}
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-surface-900">
          Annual Financial Summary — {year}
        </h2>
      </div>

      {/* Empty State */}
      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            No expense data available for {year}. Add expenses to see annual statistics.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.title} 
            className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md transition-shadow"
            title={stat.subtitle}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${colorClasses[stat.color]} flex-shrink-0`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-surface-900 break-words">
                {stat.value}
              </p>
              <p className="text-xs text-surface-600 leading-relaxed">
                {stat.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
