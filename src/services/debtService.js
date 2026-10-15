/**
 * Debt Service - Business logic for debt management
 */

/**
 * Calculate monthly interest
 * @param {number} principal - Remaining principal
 * @param {number} annualRate - Annual interest rate (percentage)
 * @returns {number} Monthly interest amount
 */
export const calculateMonthlyInterest = (principal, annualRate) => {
  const monthlyRate = annualRate / 100 / 12;
  return principal * monthlyRate;
};

/**
 * Calculate remaining balance after payment
 * @param {number} principal - Current principal
 * @param {number} payment - Payment amount
 * @param {number} annualRate - Annual interest rate
 * @returns {{ interest: number, principalPaid: number, newBalance: number }}
 */
export const calculatePaymentBreakdown = (principal, payment, annualRate) => {
  const interest = calculateMonthlyInterest(principal, annualRate);
  const principalPaid = Math.min(payment - interest, principal);
  const newBalance = Math.max(principal - principalPaid, 0);
  
  return {
    interest: Math.round(interest * 100) / 100,
    principalPaid: Math.round(principalPaid * 100) / 100,
    newBalance: Math.round(newBalance * 100) / 100,
  };
};

/**
 * Calculate months to pay off debt
 * @param {number} principal - Remaining principal
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} annualRate - Annual interest rate
 * @returns {number} Number of months to pay off
 */
export const calculatePayoffMonths = (principal, monthlyPayment, annualRate) => {
  if (monthlyPayment <= 0) return Infinity;
  
  const monthlyRate = annualRate / 100 / 12;
  
  if (monthlyRate === 0) {
    return Math.ceil(principal / monthlyPayment);
  }
  
  // Using the formula: n = -log(1 - (r*P)/M) / log(1+r)
  const numerator = Math.log(1 - (monthlyRate * principal) / monthlyPayment);
  const denominator = Math.log(1 + monthlyRate);
  
  return Math.ceil(-numerator / denominator);
};

/**
 * Get debt status based on remaining amount
 * @param {number} remaining - Remaining amount
 * @param {number} total - Total original amount
 * @returns {'paid'|'almost-paid'|'active'|'high'} Status string
 */
export const getDebtStatus = (remaining, total) => {
  if (remaining <= 0) return 'paid';
  
  const ratio = remaining / total;
  if (ratio <= 0.1) return 'almost-paid';
  if (ratio > 0.7) return 'high';
  return 'active';
};

/**
 * Filter debts by status
 * @param {Array} debts - Array of debt objects
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered debts
 */
export const filterDebtsByStatus = (debts, status) => {
  if (!status || status === 'all') return debts;
  return debts.filter(debt => debt.status === status);
};

/**
 * Sort debts by due date
 * @param {Array} debts - Array of debt objects
 * @returns {Array} Sorted debts (earliest due first)
 */
export const sortDebtsByDueDate = (debts) => {
  return [...debts].sort((a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    return dateA - dateB;
  });
};

/**
 * Sort debts by remaining amount
 * @param {Array} debts - Array of debt objects
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted debts
 */
export const sortDebtsByAmount = (debts, order = 'desc') => {
  return [...debts].sort((a, b) => {
    return order === 'desc'
      ? b.remainingAmount - a.remainingAmount
      : a.remainingAmount - b.remainingAmount;
  });
};

/**
 * Create a new debt object
 * @param {Object} debtData - Debt data
 * @returns {Object} New debt with generated ID
 */
export const createDebt = (debtData) => {
  return {
    id: generateId(),
    name: debtData.name || '',
    totalAmount: Number(debtData.totalAmount) || 0,
    remainingAmount: Number(debtData.remainingAmount) || Number(debtData.totalAmount) || 0,
    monthlyPayment: Number(debtData.monthlyPayment) || 0,
    interestRate: Number(debtData.interestRate) || 0,
    dueDate: debtData.dueDate || '',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
};

/**
 * Calculate total debt summary
 * @param {Array} debts - Array of debt objects
 * @returns {{ totalDebt: number, monthlyPayments: number, count: number }}
 */
export const calculateDebtSummary = (debts) => {
  const activeDebts = debts.filter(d => d.status === 'active');
  
  return {
    totalDebt: activeDebts.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0),
    monthlyPayments: activeDebts.reduce((sum, d) => sum + (Number(d.monthlyPayment) || 0), 0),
    count: activeDebts.length,
  };
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
