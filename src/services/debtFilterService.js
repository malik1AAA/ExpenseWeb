import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { parseISO, isAfter, isBefore, isValid } from 'date-fns';

/**
 * Create a map of debt returns by debt ID for O(1) lookups
 * Optimized for large datasets (50,000+ debt returns)
 * @param {Array} debtReturns - Array of debt return objects
 * @returns {Map} Map of debt ID to array of returns
 */
export const createDebtReturnsMap = (debtReturns) => {
  const map = new Map();
  debtReturns.forEach((ret) => {
    const debtId = ret[COLUMNS.DEBT_RETURNS.DEBT_ID];
    if (!map.has(debtId)) {
      map.set(debtId, []);
    }
    map.get(debtId).push(ret);
  });
  return map;
};

/**
 * Calculate the status of a debt
 * Optimized to use pre-computed returns map
 * @param {Object} debt - Debt object
 * @param {Map} debtReturnsMap - Map of debt ID to returns
 * @returns {string} Status: 'Paid', 'Partial', 'Overdue', or 'Active'
 */
export const calculateDebtStatus = (debt, debtReturnsMap) => {
  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const originalAmount = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);
  
  const returns = debtReturnsMap.get(debtId) || [];
  const totalReturned = returns.reduce(
    (sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 
    0
  );
  
  const remaining = originalAmount - totalReturned;
  
  if (remaining <= 0) return 'Paid';
  if (totalReturned > 0 && remaining > 0) return 'Partial';
  
  const dueDate = debt[COLUMNS.DEBTS.DUE_DATE];
  if (dueDate) {
    const due = parseISO(dueDate);
    if (isValid(due) && isBefore(due, new Date()) && totalReturned === 0) {
      return 'Overdue';
    }
  }
  
  return 'Active';
};

/**
 * Filter debts based on multiple criteria
 * Optimized for large datasets (10,000+ debts, 50,000+ debt returns)
 * @param {Array} debts - Array of debt objects
 * @param {Array} debtReturns - Array of debt return objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered debts
 */
export const filterDebts = (debts, debtReturns, filters = {}) => {
  if (!Array.isArray(debts)) return [];
  
  // Early exit if no filters are active
  const hasActiveFilters = 
    filters.search || 
    (filters.direction && filters.direction !== 'all') || 
    (filters.status && filters.status !== 'all') || 
    filters.startDate || 
    filters.endDate;
  
  if (!hasActiveFilters) return debts;

  // Create returns map once for O(1) lookups
  const debtReturnsMap = createDebtReturnsMap(debtReturns);
  
  // Pre-parse filter dates
  const startDate = filters.startDate ? parseISO(filters.startDate) : null;
  const endDate = filters.endDate ? parseISO(filters.endDate) : null;
  const searchLower = filters.search ? filters.search.toLowerCase() : null;

  return debts.filter((debt) => {
    // Search filter (person name) - check first as it's fastest
    if (searchLower) {
      const person = (debt[COLUMNS.DEBTS.PERSON] || '').toLowerCase();
      if (!person.includes(searchLower)) {
        return false;
      }
    }

    // Direction filter (Lent/Borrowed) - fast string comparison
    if (filters.direction && filters.direction !== 'all') {
      if (debt[COLUMNS.DEBTS.DIRECTION] !== filters.direction) {
        return false;
      }
    }

    // Date range filters - parse date only once
    if (startDate || endDate) {
      const debtDate = parseISO(debt[COLUMNS.DEBTS.DATE]);
      if (!isValid(debtDate)) return false;
      
      if (startDate && isBefore(debtDate, startDate)) {
        return false;
      }
      
      if (endDate && isAfter(debtDate, endDate)) {
        return false;
      }
    }

    // Status filter - most expensive, check last
    if (filters.status && filters.status !== 'all') {
      const status = calculateDebtStatus(debt, debtReturnsMap);
      if (status !== filters.status) {
        return false;
      }
    }

    return true;
  });
};
