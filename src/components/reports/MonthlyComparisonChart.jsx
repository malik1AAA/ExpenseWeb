import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { sampleExpenses, sampleIncome } from '../../data/sampleData';
import { formatCurrency } from '../../utils/currencyUtils';
import { format, parseISO } from 'date-fns';

/**
 * MonthlyComparisonChart - Monthly income vs expenses comparison using Recharts
 */
function MonthlyComparisonChart() {
  // Group transactions by month
  const monthlyData = {};
  
  [...sampleExpenses, ...sampleIncome].forEach(transaction => {
    const monthKey = format(parseISO(transaction.date), 'yyyy-MM');
    const monthLabel = format(parseISO(transaction.date), 'MMM yyyy');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthLabel, income: 0, expenses: 0 };
    }
    
    if (transaction.type === 'income') {
      monthlyData[monthKey].income += transaction.amount;
    } else {
      monthlyData[monthKey].expenses += transaction.amount;
    }
  });

  const chartData = Object.values(monthlyData).sort((a, b) => {
    // Sort by month key (chronological)
    return Object.keys(monthlyData).indexOf(
      Object.keys(monthlyData).find(k => monthlyData[k] === a)
    );
  });

  const hasData = chartData.length > 0;

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Monthly Comparison
      </h3>
      
      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
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
                dataKey="income" 
                fill="#10b981" 
                name="Income"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                fill="#ef4444" 
                name="Expenses"
                radius={[4, 4, 0, 0]}
              />
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
              Monthly data will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthlyComparisonChart;
