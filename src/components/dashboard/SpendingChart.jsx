import { PieChart } from 'lucide-react';

/**
 * SpendingChart - Dashboard spending overview chart placeholder
 * Will be implemented with Recharts when data is available
 */
function SpendingChart({ data = [] }) {
  const hasData = data && data.length > 0;

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-800">
          Spending Overview
        </h3>
        <PieChart className="w-5 h-5 text-surface-400" />
      </div>
      
      {hasData ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-surface-500">Chart will render here</p>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
          <div className="text-center">
            <PieChart className="w-12 h-12 text-surface-300 mx-auto mb-2" />
            <p className="text-surface-400 text-sm">
              Chart will appear here after adding expenses
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpendingChart;
