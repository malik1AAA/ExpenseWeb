/**
 * Calculation Service - Pure functions for financial calculations
 * 
 * All functions are pure (no side effects, don't mutate inputs).
 * Uses the Excel schema column definitions for field access.
 */

import { COLUMNS } from '../config/excelSchema';
import { parseISO, getYear, getMonth, isValid, getDaysInMonth, startOfMonth, endOfMonth, isBefore, isSameDay, isAfter } from 'date-fns';

// Field references from schema
const DATE_FIELD = COLUMNS.EXPENSES.DATE;
const AMOUNT_FIELD = COLUMNS.EXPENSES.AMOUNT;
const CATEGORY_FIELD = COLUMNS.EXPENSES.CATEGORY;

/**
 * Parse a date string to Date object
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {Date|null} Parsed date or null if invalid
 */
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Check if an expense matches a specific year and month
 * @param {Object} expense - Expense object
 * @param {number} year - Year to match
 * @param {number} month - Month to match (0-11)
 * @returns {boolean}
 */
const matchesYearMonth = (expense, year, month) => {
  const date = parseDate(expense[DATE_FIELD]);
  if (!date) return false;
  return getYear(date) === year && getMonth(date) === month;
};

/**
 * Check if an expense matches a specific year
 * @param {Object} expense - Expense object
 * @param {number} year - Year to match
 * @returns {boolean}
 */
const matchesYear = (expense, year) => {
  const date = parseDate(expense[DATE_FIELD]);
  if (!date) return false;
  return getYear(date) === year;
};

/**
 * Safely convert a value to a number
 * @param {*} value - Value to convert
 * @returns {number} Number or 0 if invalid
 */
const toNumber = (value) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get total expenses (sum of all amounts)
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Total amount
 */
export const getTotalExpenses = (expenses) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return 0;
  
  return expenses.reduce((sum, expense) => {
    return sum + toNumber(expense[AMOUNT_FIELD]);
  }, 0);
};

/**
 * Get expenses for a specific month
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @param {number} month - Month (0-11, where 0 = January)
 * @returns {Array} Filtered expenses for the month
 */
export const getExpensesForMonth = (expenses, year, month) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return [];
  if (year === undefined || month === undefined) return [];
  
  return expenses.filter((expense) => matchesYearMonth(expense, year, month));
};

/**
 * Get total amount for a specific month
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Total amount for the month
 */
export const getMonthlyTotal = (expenses, year, month) => {
  const monthExpenses = getExpensesForMonth(expenses, year, month);
  return getTotalExpenses(monthExpenses);
};

/**
 * Get total amount for a specific year
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {number} Total amount for the year
 */
export const getAnnualTotal = (expenses, year) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return 0;
  if (year === undefined) return 0;
  
  return expenses.reduce((sum, expense) => {
    if (matchesYear(expense, year)) {
      return sum + toNumber(expense[AMOUNT_FIELD]);
    }
    return sum;
  }, 0);
};

/**
 * Get expenses for a specific year
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {Array} Filtered expenses for the year
 */
export const getExpensesForYear = (expenses, year) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return [];
  if (year === undefined) return [];
  
  return expenses.filter((expense) => matchesYear(expense, year));
};

/**
 * Get totals grouped by category for a specific month
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Object} Object with category IDs as keys and totals as values
 */
export const getCategoryTotals = (expenses, year, month) => {
  const monthExpenses = getExpensesForMonth(expenses, year, month);
  
  if (monthExpenses.length === 0) return {};
  
  return monthExpenses.reduce((totals, expense) => {
    const category = expense[CATEGORY_FIELD] || 'uncategorized';
    const amount = toNumber(expense[AMOUNT_FIELD]);
    
    if (!totals[category]) {
      totals[category] = 0;
    }
    totals[category] += amount;
    
    return totals;
  }, {});
};

/**
 * Get totals grouped by category for a specific year
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {Object} Object with category IDs as keys and totals as values
 */
export const getAnnualCategoryTotals = (expenses, year) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return {};
  if (year === undefined) return {};
  
  return expenses.reduce((totals, expense) => {
    if (matchesYear(expense, year)) {
      const category = expense[CATEGORY_FIELD] || 'uncategorized';
      const amount = toNumber(expense[AMOUNT_FIELD]);
      
      if (!totals[category]) {
        totals[category] = 0;
      }
      totals[category] += amount;
    }
    return totals;
  }, {});
};

/**
 * Get monthly totals for all 12 months of a year
 * Returns an array of 12 objects, one for each month
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {Array} Array of { month: number, total: number } objects
 */
export const getMonthlyTotalsForYear = (expenses, year) => {
  if (year === undefined) {
    return Array.from({ length: 12 }, (_, i) => ({ month: i, total: 0 }));
  }
  
  return Array.from({ length: 12 }, (_, month) => ({
    month,
    total: getMonthlyTotal(expenses, year, month),
  }));
};

/**
 * Get the category with highest spending for a specific month
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {{ category: string, total: number } | null} Highest category or null if no data
 */
export const getHighestSpendingCategory = (expenses, year, month) => {
  const categoryTotals = getCategoryTotals(expenses, year, month);
  
  if (Object.keys(categoryTotals).length === 0) return null;
  
  let highestCategory = null;
  let highestTotal = -Infinity;
  
  Object.entries(categoryTotals).forEach(([category, total]) => {
    if (total > highestTotal) {
      highestTotal = total;
      highestCategory = category;
    }
  });
  
  return {
    category: highestCategory,
    total: highestTotal,
  };
};

/**
 * Get average monthly spending for a year
 * Calculates average across all 12 months (including months with 0 spending)
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {number} Average monthly spending
 */
export const getAverageMonthlySpending = (expenses, year) => {
  const annualTotal = getAnnualTotal(expenses, year);
  
  // Always divide by 12 months, even if some months have no expenses
  return annualTotal / 12;
};

/**
 * Calculate average daily expense for a specific month
 * 
 * For past months: Total expenses / Total calendar days in month
 * For current month: Total expenses (up to today) / Days elapsed (up to today)
 * 
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @param {number} month - Month (0-11, where 0 = January)
 * @param {Date} [referenceDate] - Optional reference date (defaults to today)
 * @returns {number} Average daily expense (0 if no expenses or invalid period)
 */
export const getAverageDailyExpense = (expenses, year, month, referenceDate = new Date()) => {
  if (!Array.isArray(expenses) || year === undefined || month === undefined) {
    return 0;
  }

  // Get the start and end of the target month
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  
  // Determine if this is the current month
  const currentMonthStart = startOfMonth(referenceDate);
  const isCurrentMonth = getYear(currentMonthStart) === year && getMonth(currentMonthStart) === month;
  
  // Calculate the period end date
  let periodEnd;
  let daysInPeriod;
  
  if (isCurrentMonth) {
    // For current month: use today as the end date
    periodEnd = referenceDate;
    // Calculate days from start of month to today (inclusive)
    daysInPeriod = Math.floor((periodEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;
  } else if (isBefore(monthEnd, referenceDate)) {
    // For past months: use the full month
    periodEnd = monthEnd;
    daysInPeriod = getDaysInMonth(monthStart);
  } else {
    // For future months: no data available
    return 0;
  }
  
  // Filter expenses within the period
  const periodExpenses = expenses.filter((expense) => {
    const expenseDate = parseDate(expense[DATE_FIELD]);
    if (!expenseDate) return false;
    
    // Must be within the month
    if (!isSameMonth(expenseDate, monthStart)) return false;
    
    // For current month, must not be after today
    if (isCurrentMonth && isAfter(expenseDate, periodEnd)) return false;
    
    return true;
  });
  
  // Calculate total for the period
  const total = periodExpenses.reduce((sum, expense) => {
    return sum + toNumber(expense[AMOUNT_FIELD]);
  }, 0);
  
  // Avoid division by zero
  if (daysInPeriod === 0) return 0;
  
  return total / daysInPeriod;
};

/**
 * Helper function to check if a date is in the same month as another date
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same month and year
 */
const isSameMonth = (date1, date2) => {
  return getYear(date1) === getYear(date2) && getMonth(date1) === getMonth(date2);
};

/**
 * Get count of expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Number of expenses
 */
export const getExpenseCount = (expenses) => {
  if (!Array.isArray(expenses)) return 0;
  return expenses.length;
};

/**
 * Find the expense with the highest amount
 * @param {Array} expenses - Array of expense objects
 * @returns {Object|null} Expense object with highest amount, or null if empty
 */
export const findHighestExpense = (expenses) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return null;
  
  return expenses.reduce((max, expense) => {
    const amount = toNumber(expense[AMOUNT_FIELD]);
    const maxAmount = max ? toNumber(max[AMOUNT_FIELD]) : -Infinity;
    return amount > maxAmount ? expense : max;
  }, null);
};

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS
// ============================================================================

/**
 * Get unique years from expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {Array<number>} Sorted array of unique years (descending)
 */
export const getAvailableYears = (expenses) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return [];
  
  const years = new Set();
  
  expenses.forEach((expense) => {
    const date = parseDate(expense[DATE_FIELD]);
    if (date) {
      years.add(getYear(date));
    }
  });
  
  return Array.from(years).sort((a, b) => b - a); // Descending order
};

/**
 * Get current year and month
 * @returns {{ year: number, month: number }}
 */
export const getCurrentYearMonth = () => {
  const now = new Date();
  return {
    year: getYear(now),
    month: getMonth(now),
  };
};

/**
 * Get month name from month number
 * @param {number} month - Month (0-11)
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Month name
 */
export const getMonthName = (month, locale = 'en-US') => {
  const date = new Date(2000, month, 1);
  return date.toLocaleString(locale, { month: 'long' });
};

/**
 * Get short month name from month number
 * @param {number} month - Month (0-11)
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Short month name
 */
export const getShortMonthName = (month, locale = 'en-US') => {
  const date = new Date(2000, month, 1);
  return date.toLocaleString(locale, { month: 'short' });
};

/**
 * Get daily totals for a specific month
 * Returns an array of objects with day and total
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Array} Array of { day: number, total: number } objects
 */
export const getDailyTotalsForMonth = (expenses, year, month) => {
  const monthExpenses = getExpensesForMonth(expenses, year, month);
  
  // Get number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Initialize array with zeros for all days
  const dailyTotals = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    total: 0,
  }));
  
  // Sum expenses by day
  monthExpenses.forEach((expense) => {
    const date = parseDate(expense[DATE_FIELD]);
    if (date && date.getMonth() === month && date.getFullYear() === year) {
      const day = date.getDate();
      const amount = toNumber(expense[AMOUNT_FIELD]);
      dailyTotals[day - 1].total += amount;
    }
  });
  
  return dailyTotals;
};

/**
 * Get the month with highest spending for a year
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {{ month: number, total: number } | null} Month (0-11) and total, or null if no data
 */
export const getHighestSpendingMonth = (expenses, year) => {
  const monthlyTotals = getMonthlyTotalsForYear(expenses, year);
  
  if (monthlyTotals.every(m => m.total === 0)) return null;
  
  return monthlyTotals.reduce((max, current) => {
    return current.total > max.total ? current : max;
  });
};

/**
 * Get the month with lowest spending for a year (excluding months with 0)
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {{ month: number, total: number } | null} Month (0-11) and total, or null if no data
 */
export const getLowestSpendingMonth = (expenses, year) => {
  const monthlyTotals = getMonthlyTotalsForYear(expenses, year);
  const nonZeroMonths = monthlyTotals.filter(m => m.total > 0);
  
  if (nonZeroMonths.length === 0) return null;
  
  return nonZeroMonths.reduce((min, current) => {
    return current.total < min.total ? current : min;
  });
};

/**
 * Get the category with highest spending for a year
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {{ category: string, total: number } | null} Highest category or null if no data
 */
export const getHighestSpendingCategoryForYear = (expenses, year) => {
  const categoryTotals = getAnnualCategoryTotals(expenses, year);
  
  if (Object.keys(categoryTotals).length === 0) return null;
  
  let highestCategory = null;
  let highestTotal = -Infinity;
  
  Object.entries(categoryTotals).forEach(([category, total]) => {
    if (total > highestTotal) {
      highestTotal = total;
      highestCategory = category;
    }
  });
  
  return {
    category: highestCategory,
    total: highestTotal,
  };
};

/**
 * Get monthly summary data for a year
 * Returns array of objects with month, total, count, and average
 * @param {Array} expenses - Array of expense objects
 * @param {number} year - Year
 * @returns {Array} Array of { month: number, total: number, count: number, average: number }
 */
export const getMonthlySummaryForYear = (expenses, year) => {
  return Array.from({ length: 12 }, (_, month) => {
    const monthExpenses = getExpensesForMonth(expenses, year, month);
    const total = getTotalExpenses(monthExpenses);
    const count = monthExpenses.length;
    const average = count > 0 ? total / count : 0;
    
    return {
      month,
      total,
      count,
      average,
    };
  });
};
