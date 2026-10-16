import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { parseISO, isAfter, isBefore, isValid } from 'date-fns';

/**
 * Calculate the status of a debt
 * @param {Object} debt - Debt object
 * @param {Array} debtReturns - Array of debt returns
 * @returns {string} Status: 'Paid', 'Partial', 'Overdue', or 'Active'
 */
export const calculateDebtStatus = (debt, debtReturns) => {
  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const originalAmount = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);
  
  const totalReturned = debtReturns
    .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
    .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  
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
 * @param {Array} debts - Array of debt objects
 * @param {Array} debtReturns - Array of debt return objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered debts
 */
export const filterDebts = (debts, debtReturns, filters = {}) => {
  if (!Array.isArray(debts)) return [];

  return debts.filter((debt) => {
    // Search filter (person name)
    if (filters.search) {
      const person = (debt[COLUMNS.DEBTS.PERSON] || '').toLowerCase();
      if (!person.includes(filters.search.toLowerCase())) {
        return false;
      }
    }

    // Direction filter (Lent/Borrowed)
    if (filters.direction && filters.direction !== 'all') {
      if (debt[COLUMNS.DEBTS.DIRECTION] !== filters.direction) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const status = calculateDebtStatus(debt, debtReturns);
      if (status !== filters.status) {
        return false;
      }
    }

    // Date range filter - Start date
    if (filters.startDate) {
      const debtDate = parseISO(debt[COLUMNS.DEBTS.DATE]);
      const startDate = parseISO(filters.startDate);
      if (!isValid(debtDate) || !isValid(startDate)) return false;
      if (isBefore(debtDate, startDate)) {
        return false;
      }
    }

    // Date range filter - End date
    if (filters.endDate) {
      const debtDate = parseISO(debt[COLUMNS.DEBTS.DATE]);
      const endDate = parseISO(filters.endDate);
      if (!isValid(debtDate) || !isValid(endDate)) return false;
      if (isAfter(debtDate, endDate)) {
        return false;
      }
    }

    return true;
  });
};
