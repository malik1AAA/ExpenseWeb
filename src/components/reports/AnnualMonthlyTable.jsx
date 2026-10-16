import { formatCurrency } from '../../utils/currencyUtils';
import { getMonthlySummaryForYear, getMonthName } from '../../services/calculationService';

/**
 * AnnualMonthlyTable - Monthly summary table for annual report
 */
export default function AnnualMonthlyTable({ expenses = [], year }) {
  const monthlySummary = getMonthlySummaryForYear(expenses, year);

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Monthly Summary - {year}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Month
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Total Expenses
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Number of Transactions
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Average Expense
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {monthlySummary.map((item) => (
              <tr key={item.month} className="hover:bg-surface-50 transition-colors">
                <td className="px-4 py-3 text-sm text-surface-900 font-medium">
                  {getMonthName(item.month)}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900 text-right font-semibold">
                  {formatCurrency(item.total)}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900 text-right">
                  {item.count}
                </td>
                <td className="px-4 py-3 text-sm text-surface-600 text-right">
                  {item.count > 0 ? formatCurrency(item.average) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
