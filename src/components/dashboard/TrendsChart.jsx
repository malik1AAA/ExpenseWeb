import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinance } from '../../hooks/useFinance';
import { formatCurrency } from '../../utils/currencyUtils';
import { format, parseISO } from 'date-fns';
import { COLUMNS } from '../../config/excelSchema';

const COL = COLUMNS.EXPENSES;

/**
 * TrendsChart - Monthly trends chart using Recharts
 */
function TrendsChart() {
  const { expenses } = useFinance();

  // Group expenses by month for the chart
  const monthlyData = {};
  
  expenses.forEach(expense => {
    const dateStr = expense[COL.DATE];
    if (!dateStr) return;
    
    const month = format(parseISO(dateStr), 'MMM');
    if (!monthlyData[month]) {
      monthlyData[month] = { month, expenses: 0 };
    }
    
    monthlyData[month].expenses += expense[COL.AMOUNT];
  });

  const chartData = Object.values(monthlyData);
  const hasData = chartData.length > 0;

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-surface-800">
          Monthly Trends
        </h3>
      </div>
      
      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface-100 flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-surface-400 text-sm">
              Add transactions to see trends
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrendsChart;
