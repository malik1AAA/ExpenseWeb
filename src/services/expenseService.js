/**
 * Expense Service - Business logic for expense management
 */

import { COLUMNS } from '../config/excelSchema';
import { generateExpenseId } from './idGeneratorService';

const COL = COLUMNS.EXPENSES;

/**
 * Filter expenses by date range
 * @param {Array} expenses - Array of expense objects
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Array} Filtered expenses
 */
export const filterByDateRange = (expenses, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return expenses.filter(expense => {
    const expenseDate = new Date(expense[COL.DATE]);
    return expenseDate >= start && expenseDate <= end;
  });
};

/**
 * Filter expenses by category
 * @param {Array} expenses - Array of expense objects
 * @param {string} categoryId - Category ID to filter by
 * @returns {Array} Filtered expenses
 */
export const filterByCategory = (expenses, categoryId) => {
  if (!categoryId || categoryId === 'all') return expenses;
  return expenses.filter(expense => expense[COL.CATEGORY] === categoryId);
};

/**
 * Search expenses by description
 * @param {Array} expenses - Array of expense objects
 * @param {string} query - Search query
 * @returns {Array} Matching expenses
 */
export const searchExpenses = (expenses, query) => {
  if (!query || query.trim() === '') return expenses;
  
  const lowerQuery = query.toLowerCase().trim();
  return expenses.filter(expense => 
    expense[COL.DESCRIPTION]?.toLowerCase().includes(lowerQuery) ||
    expense[COL.CATEGORY]?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Sort expenses by date (newest first by default)
 * @param {Array} expenses - Array of expense objects
 * @param {string} order - 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted expenses
 */
export const sortExpensesByDate = (expenses, order = 'desc') => {
  return [...expenses].sort((a, b) => {
    const dateA = new Date(a[COL.DATE]);
    const dateB = new Date(b[COL.DATE]);
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

/**
 * Sort expenses by amount
 * @param {Array} expenses - Array of expense objects
 * @param {string} order - 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted expenses
 */
export const sortExpensesByAmount = (expenses, order = 'desc') => {
  return [...expenses].sort((a, b) => {
    return order === 'desc' 
      ? Number(b[COL.AMOUNT]) - Number(a[COL.AMOUNT])
      : Number(a[COL.AMOUNT]) - Number(b[COL.AMOUNT]);
  });
};

/**
 * Create a new expense object
 * @param {Object} expenseData - Expense data
 * @returns {Object} New expense with generated ID
 */
export const createExpense = (expenseData) => {
  return {
    [COL.EXPENSE_ID]: expenseData[COL.EXPENSE_ID] || generateExpenseId(),
    [COL.DATE]: expenseData[COL.DATE] || new Date().toISOString().split('T')[0],
    [COL.DESCRIPTION]: expenseData[COL.DESCRIPTION] || '',
    [COL.CATEGORY]: expenseData[COL.CATEGORY] || 'other',
    [COL.AMOUNT]: Number(expenseData[COL.AMOUNT]) || 0,
    [COL.PAYMENT_METHOD]: expenseData[COL.PAYMENT_METHOD] || '',
    [COL.NOTES]: expenseData[COL.NOTES] || '',
  };
};

/**
 * Update an existing expense
 * @param {Object} existing - Existing expense object
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated expense
 */
export const updateExpense = (existing, updates) => {
  return {
    ...existing,
    ...updates,
    [COL.AMOUNT]: updates[COL.AMOUNT] !== undefined 
      ? Number(updates[COL.AMOUNT]) 
      : existing[COL.AMOUNT],
  };
};

/**
 * Map Excel row to expense object
 * @param {Object} row - Excel row object
 * @returns {Object} Expense object
 */
export const mapExcelRowToExpense = (row) => {
  return {
    [COL.EXPENSE_ID]: row[COL.EXPENSE_ID] || generateExpenseId(),
    [COL.DATE]: row[COL.DATE] || '',
    [COL.DESCRIPTION]: row[COL.DESCRIPTION] || '',
    [COL.CATEGORY]: row[COL.CATEGORY] || 'other',
    [COL.AMOUNT]: Number(row[COL.AMOUNT]) || 0,
    [COL.PAYMENT_METHOD]: row[COL.PAYMENT_METHOD] || '',
    [COL.NOTES]: row[COL.NOTES] || '',
  };
};
