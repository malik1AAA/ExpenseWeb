import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getMonthlyTotalsForYear, getShortMonthName } from '../../services/calculationService';
import { formatCurrency } from '../../utils/currencyUtils';

/**
 * MonthlySpendingChart - Bar chart showing monthly spending trend
 */
export default function MonthlySpendingChart({ expenses, year }) {
  // Memoize chart data generation
  const chartData = useMemo(() => {
    const monthlyTotals = getMonthlyTotalsForYear(expenses, year);
    return monthlyTotals.map((item) => ({
      month: getShortMonthName(item.month),
      total: item.total,
    }));
  }, [expenses, year]);

  const hasData = useMemo(
    () => chartData.some((item) => item.total > 0),
    [chartData]
  );

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Monthly Spending Trend
        </h3>
        <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface-100 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-surface-400 text-sm">
              No spending data for {year}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Monthly Spending Trend
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
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
            <Legend />
            <Bar
              dataKey="total"
              fill="#3b82f6"
              name="Spending"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
