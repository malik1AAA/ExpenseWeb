import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/currencyUtils';
import { getDailyTotalsForMonth, getMonthName } from '../../services/calculationService';

/**
 * DailySpendingChart - Bar chart showing daily spending for a month
 */
export default function DailySpendingChart({ expenses = [], year, month }) {
  const dailyTotals = getDailyTotalsForMonth(expenses, year, month);
  const hasData = dailyTotals.some((item) => item.total > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Daily Spending - {getMonthName(month)} {year}
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-surface-400 text-sm">No expenses for this month</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Daily Spending - {getMonthName(month)} {year}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailyTotals}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(day) => `Day ${day}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
