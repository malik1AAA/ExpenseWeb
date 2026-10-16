import { COLUMNS } from '../config/excelSchema';
import { parseISO, getYear, getMonth, isValid } from 'date-fns';

/**
 * Filter expenses based on multiple criteria
 * Optimized for large datasets (50,000+ records)
 * @param {Array} expenses - Array of expense objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered expenses
 */
export const filterExpenses = (expenses, filters = {}) => {
  if (!Array.isArray(expenses)) return [];
  
  // Early exit if no filters are active
  const hasActiveFilters = 
    filters.search || 
    (filters.month !== undefined && filters.month !== '') || 
    (filters.year !== undefined && filters.year !== '') || 
    filters.category || 
    filters.paymentMethod;
  
  if (!hasActiveFilters) return expenses;

  // Pre-parse filter values
  const searchLower = filters.search ? filters.search.toLowerCase() : null;
  const filterMonth = (filters.month !== undefined && filters.month !== '') 
    ? parseInt(filters.month) 
    : null;
  const filterYear = (filters.year !== undefined && filters.year !== '') 
    ? parseInt(filters.year) 
    : null;
  const filterCategory = filters.category || null;
  const filterPaymentMethod = filters.paymentMethod || null;

  return expenses.filter((expense) => {
    // Search filter (description) - check first as it's fastest
    if (searchLower) {
      const description = (expense[COLUMNS.EXPENSES.DESCRIPTION] || '').toLowerCase();
      if (!description.includes(searchLower)) {
        return false;
      }
    }

    // Category filter - fast string comparison
    if (filterCategory) {
      if (expense[COLUMNS.EXPENSES.CATEGORY] !== filterCategory) {
        return false;
      }
    }

    // Payment method filter - fast string comparison
    if (filterPaymentMethod) {
      if (expense[COLUMNS.EXPENSES.PAYMENT_METHOD] !== filterPaymentMethod) {
        return false;
      }
    }

    // Date filters - parse date only once
    if (filterMonth !== null || filterYear !== null) {
      const date = parseISO(expense[COLUMNS.EXPENSES.DATE]);
      if (!isValid(date)) return false;
      
      if (filterMonth !== null && getMonth(date) !== filterMonth) {
        return false;
      }
      
      if (filterYear !== null && getYear(date) !== filterYear) {
        return false;
      }
    }

    return true;
  });
};
