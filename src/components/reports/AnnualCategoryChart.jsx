import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * AnnualCategoryChart - Annual category distribution chart
 */
export default function AnnualCategoryChart({ categoryData = [], getCategoryName, getCategoryColor }) {
  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Annual Category Distribution
        </h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-surface-400 text-sm">No category data available</p>
        </div>
      </div>
    );
  }

  // Sort by amount descending
  const sortedData = [...categoryData].sort((a, b) => b.total - a.total);

  // Prepare data for chart
  const chartData = sortedData.map((item) => ({
    name: getCategoryName(item.category),
    value: item.total,
    color: getCategoryColor(item.category),
  }));

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Annual Category Distribution
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
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
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-surface-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
