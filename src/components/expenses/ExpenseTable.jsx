import { useState, useEffect, useMemo, useCallback } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS } from '../../config/excelSchema';
import { Button, SortableHeader } from '../common';
import { useSortableTable } from '../../hooks/useSortableTable';

/**
 * ExpenseTable - Table with sorting and pagination
 * Features:
 * - Sort by date, description, category, amount, payment method
 * - Pagination with configurable items per page
 * - Empty state with icon
 * - Responsive design
 * - Proper currency formatting
 * - Accessible sorting with aria-sort attributes
 */
export default function ExpenseTable({ 
  expenses = [], 
  categories = [],
  onEdit, 
  onDelete 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to first page when expenses change (e.g., after filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [expenses]);

  // Create a category map for O(1) lookups
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat[COLUMNS.CATEGORIES.CATEGORY_ID], cat);
    });
    return map;
  }, [categories]);

  // Get category name by ID (memoized)
  const getCategoryName = useCallback(
    (categoryId) => {
      const category = categoryMap.get(categoryId);
      return category ? category[COLUMNS.CATEGORIES.CATEGORY_NAME] : categoryId;
    },
    [categoryMap]
  );

  // Use sortable table hook with default sort by date descending
  const { handleSort, getSortState, sortedData: sortedExpenses } = useSortableTable(
    expenses,
    COLUMNS.EXPENSES.DATE,
    'desc'
  );

  // Pagination (memoized)
  const totalPages = useMemo(
    () => Math.ceil(sortedExpenses.length / itemsPerPage),
    [sortedExpenses.length, itemsPerPage]
  );
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  const paginatedExpenses = useMemo(() => {
    return sortedExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedExpenses, startIndex, itemsPerPage]);

  // Wrap handleSort to reset pagination
  const handleSortWithReset = useCallback((field) => {
    handleSort(field);
    setCurrentPage(1);
  }, [handleSort]);

  // Empty state
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 mb-2">
            No expenses found
          </h3>
          <p className="text-surface-500 text-sm max-w-md">
            Try adjusting your filters or add a new expense to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <SortableHeader
                label="Date"
                field={COLUMNS.EXPENSES.DATE}
                sortState={getSortState(COLUMNS.EXPENSES.DATE)}
                onSort={handleSortWithReset}
                align="left"
              />
              <SortableHeader
                label="Description"
                field={COLUMNS.EXPENSES.DESCRIPTION}
                sortState={getSortState(COLUMNS.EXPENSES.DESCRIPTION)}
                onSort={handleSortWithReset}
                align="left"
              />
              <SortableHeader
                label="Category"
                field={COLUMNS.EXPENSES.CATEGORY}
                sortState={getSortState(COLUMNS.EXPENSES.CATEGORY)}
                onSort={handleSortWithReset}
                align="left"
              />
              <SortableHeader
                label="Amount"
                field={COLUMNS.EXPENSES.AMOUNT}
                sortState={getSortState(COLUMNS.EXPENSES.AMOUNT)}
                onSort={handleSortWithReset}
                align="right"
              />
              <SortableHeader
                label="Payment Method"
                field={COLUMNS.EXPENSES.PAYMENT_METHOD}
                sortState={getSortState(COLUMNS.EXPENSES.PAYMENT_METHOD)}
                onSort={handleSortWithReset}
                align="left"
              />
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {paginatedExpenses.map((expense) => (
              <tr key={expense[COLUMNS.EXPENSES.EXPENSE_ID]} className="hover:bg-surface-50 transition-colors">
                <td className="px-4 py-3 text-sm text-surface-900 whitespace-nowrap">
                  {formatDate(expense[COLUMNS.EXPENSES.DATE])}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900 font-medium">
                  {expense[COLUMNS.EXPENSES.DESCRIPTION]}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    {getCategoryName(expense[COLUMNS.EXPENSES.CATEGORY])}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-surface-900 text-right font-semibold whitespace-nowrap">
                  {formatCurrency(expense[COLUMNS.EXPENSES.AMOUNT])}
                </td>
                <td className="px-4 py-3 text-sm text-surface-600">
                  {expense[COLUMNS.EXPENSES.PAYMENT_METHOD] || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-surface-600 max-w-xs">
                  <div className="truncate" title={expense[COLUMNS.EXPENSES.NOTES]}>
                    {expense[COLUMNS.EXPENSES.NOTES] || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(expense)}
                      className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-surface-600" />
                    </button>
                    <button
                      onClick={() => onDelete(expense)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-surface-100">
        {paginatedExpenses.map((expense) => (
          <div key={expense[COLUMNS.EXPENSES.EXPENSE_ID]} className="p-4 hover:bg-surface-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 truncate">
                  {expense[COLUMNS.EXPENSES.DESCRIPTION]}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  {formatDate(expense[COLUMNS.EXPENSES.DATE])}
                </p>
              </div>
              <p className="text-sm font-bold text-surface-900 ml-2 whitespace-nowrap">
                {formatCurrency(expense[COLUMNS.EXPENSES.AMOUNT])}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  {getCategoryName(expense[COLUMNS.EXPENSES.CATEGORY])}
                </span>
                {expense[COLUMNS.EXPENSES.PAYMENT_METHOD] && (
                  <span className="text-xs text-surface-500">
                    {expense[COLUMNS.EXPENSES.PAYMENT_METHOD]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-surface-600" />
                </button>
                <button
                  onClick={() => onDelete(expense)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            {expense[COLUMNS.EXPENSES.NOTES] && (
              <p className="text-xs text-surface-500 mt-2 truncate">
                {expense[COLUMNS.EXPENSES.NOTES]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-surface-200 bg-surface-50">
          <div className="flex items-center gap-3">
            <div className="text-sm text-surface-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedExpenses.length)} of {sortedExpenses.length}
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border border-surface-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              icon={ChevronLeft}
            >
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-sm text-surface-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              icon={ChevronRight}
            >
              <span className="hidden sm:inline">Next</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
