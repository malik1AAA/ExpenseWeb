import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * CategoryBarChart - Bar chart showing category spending
 */
export default function CategoryBarChart({ categoryData = [], getCategoryName, getCategoryColor }) {
  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Category Spending
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-surface-400 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Sort by amount descending
  const sortedData = [...categoryData].sort((a, b) => b.total - a.total);

  // Prepare data for chart
  const chartData = sortedData.map((item) => ({
    category: getCategoryName(item.category),
    amount: item.total,
    color: getCategoryColor(item.category),
  }));

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Category Spending
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="category"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `Rs ${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
