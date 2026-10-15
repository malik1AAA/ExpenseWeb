import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinance } from '../../hooks/useFinance';
import { formatCurrency } from '../../utils/currencyUtils';
import { format, parseISO } from 'date-fns';
import { COLUMNS } from '../../config/excelSchema';

const COL = COLUMNS.EXPENSES;

/**
 * MonthlyComparisonChart - Monthly expenses comparison using Recharts
 */
function MonthlyComparisonChart() {
  const { expenses } = useFinance();

  // Group expenses by month
  const monthlyData = {};
  
  expenses.forEach(expense => {
    const dateStr = expense[COL.DATE];
    if (!dateStr) return;
    
    const monthKey = format(parseISO(dateStr), 'yyyy-MM');
    const monthLabel = format(parseISO(dateStr), 'MMM yyyy');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthLabel, expenses: 0 };
    }
    
    monthlyData[monthKey].expenses += expense[COL.AMOUNT];
  });

  const chartData = Object.values(monthlyData).sort((a, b) => {
    const dateA = parseISO(Object.keys(monthlyData).find(k => monthlyData[k] === a) + '-01');
    const dateB = parseISO(Object.keys(monthlyData).find(k => monthlyData[k] === b) + '-01');
    return dateA - dateB;
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
