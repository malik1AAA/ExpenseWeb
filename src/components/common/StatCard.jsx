import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * StatCard - Reusable statistics display card
 * Used on Dashboard and other pages for key metrics
 */
function StatCard({ title, value, change, trend, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        {change !== undefined && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {change}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-surface-900">{value}</p>
        <p className="text-sm text-surface-500 mt-0.5">{title}</p>
      </div>
    </div>
  );
}

export default StatCard;
