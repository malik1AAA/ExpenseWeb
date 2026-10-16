import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getCategoryTotals } from '../../services/calculationService';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * CategoryBreakdownChart - Pie chart showing category breakdown
 */
export default function CategoryBreakdownChart({ expenses, year, month, getCategoryName, getCategoryColor }) {
  // Memoize chart data generation
  const chartData = useMemo(() => {
    const categoryTotals = getCategoryTotals(expenses, year, month);
    return Object.entries(categoryTotals).map(([categoryId, total]) => ({
      name: getCategoryName(categoryId),
      value: total,
      color: getCategoryColor(categoryId),
    }));
  }, [expenses, year, month, getCategoryName, getCategoryColor]);

  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Category Breakdown
        </h3>
        <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface-100 flex items-center justify-center">
              <span className="text-2xl">🥧</span>
            </div>
            <p className="text-surface-400 text-sm">
              No expenses for this month
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Category Breakdown
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
