/**
 * Calculation Service - Financial calculations and aggregations
 */

/**
 * Calculate total amount from array of transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {string} amountField - Field name for amount (default: 'amount')
 * @returns {number} Total amount
 */
export const calculateTotal = (transactions, amountField = 'amount') => {
  return transactions.reduce((sum, t) => sum + (Number(t[amountField]) || 0), 0);
};

/**
 * Calculate total income
 * @param {Array} transactions - Array of transactions
 * @returns {number} Total income
 */
export const calculateTotalIncome = (transactions) => {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

/**
 * Calculate total expenses
 * @param {Array} transactions - Array of transactions
 * @returns {number} Total expenses
 */
export const calculateTotalExpenses = (transactions) => {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
};

/**
 * Calculate balance (income - expenses)
 * @param {Array} transactions - Array of transactions
 * @returns {number} Balance
 */
export const calculateBalance = (transactions) => {
  return calculateTotalIncome(transactions) - calculateTotalExpenses(transactions);
};

/**
 * Group transactions by category
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Object with category IDs as keys and totals as values
 */
export const groupByCategory = (transactions) => {
  return transactions.reduce((groups, t) => {
    const category = t.category || 'other';
    if (!groups[category]) {
      groups[category] = 0;
    }
    groups[category] += Number(t.amount) || 0;
    return groups;
  }, {});
};

/**
 * Group transactions by date
 * @param {Array} transactions - Array of transactions
 * @param {string} dateFormat - Date format key (default: 'date')
 * @returns {Object} Object with dates as keys and arrays of transactions as values
 */
export const groupByDate = (transactions, dateField = 'date') => {
  return transactions.reduce((groups, t) => {
    const date = t[dateField];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(t);
    return groups;
  }, {});
};

/**
 * Group transactions by month
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Object with month keys (YYYY-MM) and totals
 */
export const groupByMonth = (transactions) => {
  return transactions.reduce((groups, t) => {
    const month = t.date ? t.date.substring(0, 7) : 'unknown';
    if (!groups[month]) {
      groups[month] = { income: 0, expenses: 0, transactions: [] };
    }
    if (t.type === 'income') {
      groups[month].income += Number(t.amount) || 0;
    } else {
      groups[month].expenses += Number(t.amount) || 0;
    }
    groups[month].transactions.push(t);
    return groups;
  }, {});
};

/**
 * Calculate average daily spending
 * @param {Array} expenses - Array of expense transactions
 * @param {number} days - Number of days to average over
 * @returns {number} Average daily spending
 */
export const calculateAverageDaily = (expenses, days = 30) => {
  if (days === 0) return 0;
  const total = calculateTotal(expenses);
  return total / days;
};

/**
 * Find highest expense
 * @param {Array} expenses - Array of expense transactions
 * @returns {Object|null} Transaction with highest amount
 */
export const findHighestExpense = (expenses) => {
  if (expenses.length === 0) return null;
  return expenses.reduce((max, t) => 
    Number(t.amount) > Number(max.amount) ? t : max
  );
};

/**
 * Get top categories by spending
 * @param {Array} expenses - Array of expense transactions
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
