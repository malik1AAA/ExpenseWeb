import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinance } from '../../hooks/useFinance';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * CategoryChart - Category breakdown chart for reports page using Recharts
 */
function CategoryChart() {
  const { topCategories, getCategoryName, getCategoryColor } = useFinance();

  const chartData = topCategories.map(item => ({
    name: getCategoryName(item.category),
    amount: item.total,
    fill: getCategoryColor(item.category),
  }));

  const hasData = chartData.length > 0;

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Category Breakdown
      </h3>
      
      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={11}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
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
              <Legend />
              <Bar 
                dataKey="amount" 
                name="Amount"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Bar key={`bar-${index}`} dataKey="amount" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface-100 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-surface-400 text-sm">
              Add expenses to see category breakdown
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryChart;
