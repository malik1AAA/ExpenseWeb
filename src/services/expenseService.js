/**
 * Expense Service - Business logic for expense management
 */

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
    const expenseDate = new Date(expense.date);
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
  return expenses.filter(expense => expense.category === categoryId);
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
    expense.description?.toLowerCase().includes(lowerQuery) ||
    expense.category?.toLowerCase().includes(lowerQuery)
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
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
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
      ? Number(b.amount) - Number(a.amount)
      : Number(a.amount) - Number(b.amount);
  });
};

/**
 * Create a new expense object
 * @param {Object} expenseData - Expense data
 * @returns {Object} New expense with generated ID
 */
export const createExpense = (expenseData) => {
  return {
    id: generateId(),
    date: expenseData.date || new Date().toISOString().split('T')[0],
    description: expenseData.description || '',
    category: expenseData.category || 'other',
    amount: Number(expenseData.amount) || 0,
    type: 'expense',
    createdAt: new Date().toISOString(),
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
    amount: updates.amount !== undefined ? Number(updates.amount) : existing.amount,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Map Excel row to expense object
 * @param {Object} row - Excel row object
 * @param {Object} columnMapping - Column name mapping
 * @returns {Object} Expense object
 */
export const mapExcelRowToExpense = (row, columnMapping = {}) => {
  const mapping = {
    date: columnMapping.date || 'Date',
    description: columnMapping.description || 'Description',
    category: columnMapping.category || 'Category',
    amount: columnMapping.amount || 'Amount',
  };
  
  return {
    id: generateId(),
    date: row[mapping.date] || '',
    description: row[mapping.description] || '',
    category: (row[mapping.category] || 'other').toLowerCase().replace(/\s+/g, '-'),
    amount: Number(row[mapping.amount]) || 0,
    type: 'expense',
  };
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
