/**
 * Calculation Service - Financial calculations and aggregations
 */

import { COLUMNS } from '../config/excelSchema';

const EXP_COL = COLUMNS.EXPENSES;
const CAT_COL = COLUMNS.CATEGORIES;

/**
 * Calculate total amount from array of transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {string} amountField - Field name for amount (default: EXP_COL.AMOUNT)
 * @returns {number} Total amount
 */
export const calculateTotal = (transactions, amountField = EXP_COL.AMOUNT) => {
  return transactions.reduce((sum, t) => sum + (Number(t[amountField]) || 0), 0);
};

/**
 * Calculate total expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Total expenses
 */
export const calculateTotalExpenses = (expenses) => {
  return expenses.reduce((sum, t) => sum + (Number(t[EXP_COL.AMOUNT]) || 0), 0);
};

/**
 * Group expenses by category
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Object with category IDs as keys and totals as values
 */
export const groupByCategory = (expenses) => {
  return expenses.reduce((groups, t) => {
    const category = t[EXP_COL.CATEGORY] || 'other';
    if (!groups[category]) {
      groups[category] = 0;
    }
    groups[category] += Number(t[EXP_COL.AMOUNT]) || 0;
    return groups;
  }, {});
};

/**
 * Group expenses by date
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Object with dates as keys and arrays of expenses as values
 */
export const groupByDate = (expenses) => {
  return expenses.reduce((groups, t) => {
    const date = t[EXP_COL.DATE];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(t);
    return groups;
  }, {});
};

/**
 * Group expenses by month
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Object with month keys (YYYY-MM) and totals
 */
export const groupByMonth = (expenses) => {
  return expenses.reduce((groups, t) => {
    const month = t[EXP_COL.DATE] ? t[EXP_COL.DATE].substring(0, 7) : 'unknown';
    if (!groups[month]) {
      groups[month] = { total: 0, expenses: [] };
    }
    groups[month].total += Number(t[EXP_COL.AMOUNT]) || 0;
    groups[month].expenses.push(t);
    return groups;
  }, {});
};

/**
 * Calculate average daily spending
 * @param {Array} expenses - Array of expense objects
 * @param {number} days - Number of days to average over
 * @returns {number} Average daily spending
 */
export const calculateAverageDaily = (expenses, days = 30) => {
  if (days === 0) return 0;
  const total = calculateTotalExpenses(expenses);
  return total / days;
};

/**
 * Find highest expense
 * @param {Array} expenses - Array of expense objects
 * @returns {Object|null} Expense with highest amount
 */
export const findHighestExpense = (expenses) => {
  if (expenses.length === 0) return null;
  return expenses.reduce((max, t) => 
    Number(t[EXP_COL.AMOUNT]) > Number(max[EXP_COL.AMOUNT]) ? t : max
  );
};

/**
 * Get top categories by spending
 * @param {Array} expenses - Array of expense objects
 * @param {number} limit - Number of top categories to return
 * @returns {Array} Array of { category, total } objects sorted by total
 */
export const getTopCategories = (expenses, limit = 5) => {
  const grouped = groupByCategory(expenses);
  return Object.entries(grouped)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

/**
 * Calculate percentage of total
 * @param {number} value - Value to calculate percentage for
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Get category name from categories list
 * @param {Array} categories - Array of category objects
 * @param {string} categoryId - Category ID
 * @returns {string} Category name
 */
export const getCategoryName = (categories, categoryId) => {
  const category = categories.find(cat => cat[CAT_COL.CATEGORY_ID] === categoryId);
  return category ? category[CAT_COL.CATEGORY_NAME] : categoryId;
};
