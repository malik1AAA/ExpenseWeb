import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * SummaryCard - Reusable card for displaying key metrics
 * Enhanced with better visual hierarchy and hover effects
 */
export default function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue' 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6 hover:shadow-lg hover:border-surface-300 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        {trend !== undefined && trendValue !== undefined && (
          <div className={`flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full ${
            trend === 'up' 
              ? 'text-green-700 bg-green-50' 
              : 'text-red-700 bg-red-50'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-surface-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-surface-600">{title}</p>
      </div>
    </div>
  );
}
