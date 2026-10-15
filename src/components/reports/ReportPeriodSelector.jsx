import { Calendar } from 'lucide-react';

/**
 * ReportPeriodSelector - Period selection for reports page
 */
function ReportPeriodSelector({ selected, onSelect }) {
  const periods = ['This Week', 'This Month', 'Last Month', 'This Quarter', 'This Year'];

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-surface-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Period:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => onSelect?.(period)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selected === period
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportPeriodSelector;
