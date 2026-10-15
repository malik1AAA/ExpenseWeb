import { BarChart3 } from 'lucide-react';

/**
 * ChartPlaceholder - Placeholder for charts that will be implemented with Recharts
 */
function ChartPlaceholder({ title, message }) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        {title || 'Chart'}
      </h3>
      <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-2" />
          <p className="text-surface-400 text-sm">
            {message || 'Add data to see this chart'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChartPlaceholder;
