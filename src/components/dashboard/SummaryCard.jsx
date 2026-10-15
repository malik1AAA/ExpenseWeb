import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * SummaryCard - Reusable card for displaying key metrics
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
    <div className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend !== undefined && trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900">{value}</p>
        <p className="text-sm text-surface-500 mt-1">{title}</p>
      </div>
    </div>
  );
}
