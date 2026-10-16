import { formatCurrency } from '../../utils/currencyUtils';

/**
 * AnnualCategoryBreakdown - Annual category breakdown table
 */
export default function AnnualCategoryBreakdown({ categoryData = [], total = 0, getCategoryName }) {
  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Annual Category Breakdown
        </h3>
        <div className="text-center py-8">
          <p className="text-surface-400 text-sm">
            No category data available for this year
          </p>
        </div>
      </div>
    );
  }

  // Sort by amount descending
  const sortedData = [...categoryData].sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Annual Category Breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Annual Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Percentage
              </th>
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
