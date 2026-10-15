import { COLUMNS } from '../config/excelSchema';
import { parseISO, getYear, getMonth, isValid } from 'date-fns';

/**
 * Filter expenses based on multiple criteria
 * @param {Array} expenses - Array of expense objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered expenses
 */
export const filterExpenses = (expenses, filters = {}) => {
  if (!Array.isArray(expenses)) return [];

  return expenses.filter((expense) => {
    // Search filter (description)
    if (filters.search) {
      const description = (expense[COLUMNS.EXPENSES.DESCRIPTION] || '').toLowerCase();
      if (!description.includes(filters.search.toLowerCase())) {
        return false;
      }
    }

    // Month filter
    if (filters.month !== undefined && filters.month !== '') {
      const date = parseISO(expense[COLUMNS.EXPENSES.DATE]);
      if (!isValid(date)) return false;
      if (getMonth(date) !== parseInt(filters.month)) {
        return false;
      }
    }

    // Year filter
    if (filters.year !== undefined && filters.year !== '') {
      const date = parseISO(expense[COLUMNS.EXPENSES.DATE]);
      if (!isValid(date)) return false;
      if (getYear(date) !== parseInt(filters.year)) {
        return false;
      }
    }

    // Category filter
    if (filters.category) {
      if (expense[COLUMNS.EXPENSES.CATEGORY] !== filters.category) {
        return false;
      }
    }

    // Payment method filter
    if (filters.paymentMethod) {
      if (expense[COLUMNS.EXPENSES.PAYMENT_METHOD] !== filters.paymentMethod) {
        return false;
      }
    }

    return true;
  });
};
