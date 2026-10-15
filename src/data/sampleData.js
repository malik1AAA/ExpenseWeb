/**
 * Sample data for the finance application
 * Used for development and demo purposes
 */

export const sampleCategories = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#f97316' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { id: 'housing', name: 'Housing', icon: '🏠', color: '#8b5cf6' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#eab308' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#10b981' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#6366f1' },
  { id: 'education', name: 'Education', icon: '📚', color: '#14b8a6' },
  { id: 'salary', name: 'Salary', icon: '💰', color: '#22c55e' },
  { id: 'other', name: 'Other', icon: '📦', color: '#64748b' },
];

export const sampleExpenses = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Grocery Store',
    category: 'food',
    amount: 85.50,
    type: 'expense',
  },
  {
    id: '2',
    date: '2024-01-14',
    description: 'Gas Station',
    category: 'transport',
    amount: 45.00,
    type: 'expense',
  },
  {
    id: '3',
    date: '2024-01-13',
    description: 'Monthly Rent',
    category: 'housing',
    amount: 1200.00,
    type: 'expense',
  },
  {
    id: '4',
    date: '2024-01-12',
    description: 'Electric Bill',
    category: 'utilities',
    amount: 120.00,
    type: 'expense',
  },
  {
    id: '5',
    date: '2024-01-11',
    description: 'Movie Tickets',
    category: 'entertainment',
    amount: 32.00,
    type: 'expense',
  },
];

export const sampleIncome = [
  {
    id: '101',
    date: '2024-01-01',
    description: 'Monthly Salary',
    category: 'salary',
    amount: 5000.00,
    type: 'income',
  },
];

export const sampleDebts = [
  {
    id: 'd1',
    name: 'Student Loan',
    totalAmount: 25000,
    remainingAmount: 18500,
    monthlyPayment: 350,
    interestRate: 4.5,
    dueDate: '2024-01-28',
    status: 'active',
  },
  {
    id: 'd2',
    name: 'Credit Card',
    totalAmount: 5000,
    remainingAmount: 1200,
    monthlyPayment: 200,
    interestRate: 18.9,
    dueDate: '2024-01-25',
    status: 'active',
  },
];

export const sampleTransactions = [
  ...sampleExpenses,
  ...sampleIncome,
];

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {object|undefined} Category object
 */
export const getCategoryById = (categoryId) => {
  return sampleCategories.find(cat => cat.id === categoryId);
};

/**
 * Get all category options for select inputs
 * @returns {Array} Array of { value, label } objects
 */
export const getCategoryOptions = () => {
  return sampleCategories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));
};
