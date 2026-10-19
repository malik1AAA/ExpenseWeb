import { formatCurrency } from '../../utils/currencyUtils';
import { SortableHeader } from '../common';
import { useSortableTable } from '../../hooks/useSortableTable';

/**
 * CategoryBreakdown - Table showing category breakdown with amounts and percentages
 * Features interactive sorting by category, amount, and percentage
 */
export default function CategoryBreakdown({ categoryData = [], total = 0, getCategoryName }) {
  // Enrich data with percentage for sorting
  const enrichedData = categoryData.map(item => ({
    ...item,
    percentage: total > 0 ? (item.total / total) * 100 : 0,
  }));

  // Use sortable table hook with default sort by amount descending
  const { handleSort, getSortState, sortedData } = useSortableTable(
    enrichedData,
    'total',
    'desc'
  );

  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Category Breakdown
        </h3>
        <div className="text-center py-8">
          <p className="text-surface-400 text-sm">
            No expenses found for this period
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Category Breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <SortableHeader
                label="Category"
                field="category"
                sortState={getSortState('category')}
                onSort={handleSort}
                align="left"
              />
              <SortableHeader
                label="Amount"
                field="total"
                sortState={getSortState('total')}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="Percentage"
                field="percentage"
                sortState={getSortState('percentage')}
                onSort={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {sortedData.map((item) => {
              const percentage = total > 0 ? (item.total / total) * 100 : 0;
              return (
                <tr key={item.category} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-surface-900 font-medium">
                    {getCategoryName(item.category)}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-900 text-right font-semibold">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-600 text-right">
                    {percentage.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-surface-50 border-t-2 border-surface-200">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-surface-900">
                Total
              </td>
              <td className="px-4 py-3 text-sm text-surface-900 text-right font-bold">
                {formatCurrency(total)}
              </td>
              <td className="px-4 py-3 text-sm text-surface-600 text-right font-semibold">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
