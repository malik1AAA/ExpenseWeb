import { useState } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { COLUMNS } from '../../config/excelSchema';
import { Button } from '../common';

/**
 * ExpenseTable - Table with sorting and pagination
 */
export default function ExpenseTable({ 
  expenses = [], 
  categories = [],
  onEdit, 
  onDelete 
}) {
  const [sortField, setSortField] = useState(COLUMNS.EXPENSES.DATE);
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (cat) => cat[COLUMNS.CATEGORIES.CATEGORY_ID] === categoryId
    );
    return category ? category[COLUMNS.CATEGORIES.CATEGORY_NAME] : categoryId;
  };

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle numeric fields
    if (sortField === COLUMNS.EXPENSES.AMOUNT) {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    }

    // Handle date fields
    if (sortField === COLUMNS.EXPENSES.DATE) {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = sortedExpenses.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
        <p className="text-surface-500">No expenses found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                onClick={() => handleSort(COLUMNS.EXPENSES.DATE)}
              >
                Date {getSortIcon(COLUMNS.EXPENSES.DATE)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Category
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                onClick={() => handleSort(COLUMNS.EXPENSES.AMOUNT)}
              >
                Amount {getSortIcon(COLUMNS.EXPENSES.AMOUNT)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider">
                Payment Method
              </th>
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
              <tr key={expense[COLUMNS.EXPENSES.EXPENSE_ID]} className="hover:bg-surface-50">
                <td className="px-4 py-3 text-sm text-surface-900">
                  {formatDate(expense[COLUMNS.EXPENSES.DATE])}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900">
                  {expense[COLUMNS.EXPENSES.DESCRIPTION]}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900">
                  {getCategoryName(expense[COLUMNS.EXPENSES.CATEGORY])}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900 text-right font-medium">
                  {formatCurrency(expense[COLUMNS.EXPENSES.AMOUNT])}
                </td>
                <td className="px-4 py-3 text-sm text-surface-900">
                  {expense[COLUMNS.EXPENSES.PAYMENT_METHOD] || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-surface-600 max-w-xs truncate">
                  {expense[COLUMNS.EXPENSES.NOTES] || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
          <div className="text-sm text-surface-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedExpenses.length)} of {sortedExpenses.length} expenses
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              icon={ChevronLeft}
            >
              Previous
            </Button>
            <span className="text-sm text-surface-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              icon={ChevronRight}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
