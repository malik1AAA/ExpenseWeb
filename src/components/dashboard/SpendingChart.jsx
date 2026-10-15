import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinance } from '../../hooks/useFinance';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * SpendingChart - Dashboard spending overview chart using Recharts
 */
function SpendingChart() {
  const { topCategories, getCategoryName, getCategoryColor } = useFinance();

  // Transform data for Recharts
  const chartData = topCategories.map(item => ({
    name: getCategoryName(item.category),
    value: item.total,
    color: getCategoryColor(item.category),
  }));

  const hasData = chartData.length > 0;

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-800">
          Spending Overview
        </h3>
      </div>
      
      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
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
                formatter={(value) => <span className="text-xs text-surface-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface-100 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-surface-400 text-sm">
              Add expenses to see spending breakdown
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpendingChart;
