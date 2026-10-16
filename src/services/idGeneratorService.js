/**
 * ID Generation Service
 * Generates sequential IDs for expenses, debts, and debt returns
 * Format: EXP_1, EXP_2, DEBT_1, DEBT_2, RET_1, RET_2
 */

const STORAGE_KEY = 'finance_app_id_counters';

/**
 * Get ID counters from localStorage
 * @returns {Object} Counter object with expense, debt, and return counters
 */
const getIdCounters = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading ID counters from localStorage:', error);
  }
  
  return {
    expense: 0,
    debt: 0,
    return: 0,
  };
};

/**
 * Save ID counters to localStorage
 * @param {Object} counters - Counter object
 */
const saveIdCounters = (counters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  } catch (error) {
    console.error('Error saving ID counters to localStorage:', error);
  }
};

/**
 * Generate next sequential expense ID
 * @returns {string} Expense ID in format EXP_1, EXP_2, etc.
 */
export const generateExpenseId = () => {
  const counters = getIdCounters();
  counters.expense += 1;
  saveIdCounters(counters);
  return `EXP_${counters.expense}`;
};

/**
 * Generate next sequential debt ID
 * @returns {string} Debt ID in format DEBT_1, DEBT_2, etc.
 */
export const generateDebtId = () => {
  const counters = getIdCounters();
  counters.debt += 1;
  saveIdCounters(counters);
  return `DEBT_${counters.debt}`;
};

/**
 * Generate next sequential return ID
 * @returns {string} Return ID in format RET_1, RET_2, etc.
 */
export const generateReturnId = () => {
  const counters = getIdCounters();
  counters.return += 1;
  saveIdCounters(counters);
  return `RET_${counters.return}`;
};

/**
 * Get current counter values (for debugging)
 * @returns {Object} Current counter values
 */
export const getCurrentCounters = () => {
  return getIdCounters();
};

/**
 * Reset all counters (for testing/debugging)
 */
export const resetCounters = () => {
  saveIdCounters({
    expense: 0,
    debt: 0,
    return: 0,
  });
};

/**
 * Sync counters with existing data
 * Call this on app initialization to ensure counters are ahead of existing IDs
 * @param {Array} expenses - Array of expense objects
 * @param {Array} debts - Array of debt objects
 * @param {Array} debtReturns - Array of debt return objects
 */
export const syncCountersWithData = (expenses = [], debts = [], debtReturns = []) => {
  const counters = getIdCounters();
  
  // Find highest expense ID number
  let maxExpenseNum = 0;
  expenses.forEach(expense => {
    const id = expense.ExpenseID || expense.EXPENSE_ID;
    if (id && id.startsWith('EXP_')) {
      const num = parseInt(id.replace('EXP_', ''), 10);
      if (!isNaN(num) && num > maxExpenseNum) {
        maxExpenseNum = num;
      }
    }
  });
  
  // Find highest debt ID number
  let maxDebtNum = 0;
  debts.forEach(debt => {
    const id = debt.DebtID || debt.DEBT_ID;
    if (id && id.startsWith('DEBT_')) {
      const num = parseInt(id.replace('DEBT_', ''), 10);
      if (!isNaN(num) && num > maxDebtNum) {
        maxDebtNum = num;
      }
    }
  });
  
  // Find highest return ID number
  let maxReturnNum = 0;
  debtReturns.forEach(ret => {
    const id = ret.ReturnID || ret.RETURN_ID;
    if (id && id.startsWith('RET_')) {
      const num = parseInt(id.replace('RET_', ''), 10);
      if (!isNaN(num) && num > maxReturnNum) {
        maxReturnNum = num;
      }
    }
  });
  
  // Update counters if needed
  let updated = false;
  if (maxExpenseNum > counters.expense) {
    counters.expense = maxExpenseNum;
    updated = true;
  }
  if (maxDebtNum > counters.debt) {
    counters.debt = maxDebtNum;
    updated = true;
  }
  if (maxReturnNum > counters.return) {
    counters.return = maxReturnNum;
    updated = true;
  }
  
  if (updated) {
    saveIdCounters(counters);
  }
  
  return counters;
};
