import { formatCurrency } from '../../utils/currencyUtils';
import { getMonthlySummaryForYear, getMonthName } from '../../services/calculationService';
import { SortableHeader } from '../common';
import { useSortableTable } from '../../hooks/useSortableTable';

/**
 * AnnualMonthlyTable - Monthly summary table for annual report
 * Features interactive sorting by month, total expenses, transaction count, and average
 */
export default function AnnualMonthlyTable({ expenses = [], year }) {
  const monthlySummary = getMonthlySummaryForYear(expenses, year);

  // Use sortable table hook with default sort by month ascending
  const { handleSort, getSortState, sortedData } = useSortableTable(
    monthlySummary,
    'month',
    'asc'
  );

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Monthly Summary - {year}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <SortableHeader
                label="Month"
                field="month"
                sortState={getSortState('month')}
                onSort={handleSort}
                align="left"
              />
              <SortableHeader
                label="Total Expenses"
                field="total"
                sortState={getSortState('total')}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="Number of Transactions"
                field="count"
                sortState={getSortState('count')}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="Average Expense"
                field="average"
                sortState={getSortState('average')}
                onSort={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {sortedData.map((item) => (
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
