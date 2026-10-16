/**
 * Debt Service - Business logic for debt management
 */

import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { generateDebtId, generateReturnId } from './idGeneratorService';

const COL = COLUMNS.DEBTS;
const RET_COL = COLUMNS.DEBT_RETURNS;

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
 * Filter debts by direction
 * @param {Array} debts - Array of debt objects
 * @param {string} direction - Direction to filter by (Lent/Borrowed)
 * @returns {Array} Filtered debts
 */
export const filterDebtsByDirection = (debts, direction) => {
  if (!direction || direction === 'all') return debts;
  return debts.filter(debt => debt[COL.DIRECTION] === direction);
};

/**
 * Sort debts by due date
 * @param {Array} debts - Array of debt objects
 * @returns {Array} Sorted debts (earliest due first)
 */
export const sortDebtsByDueDate = (debts) => {
  return [...debts].sort((a, b) => {
    const dateA = new Date(a[COL.DUE_DATE]);
    const dateB = new Date(b[COL.DUE_DATE]);
    return dateA - dateB;
  });
};

/**
 * Sort debts by original amount
 * @param {Array} debts - Array of debt objects
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted debts
 */
export const sortDebtsByAmount = (debts, order = 'desc') => {
  return [...debts].sort((a, b) => {
    return order === 'desc'
      ? b[COL.ORIGINAL_AMOUNT] - a[COL.ORIGINAL_AMOUNT]
      : a[COL.ORIGINAL_AMOUNT] - b[COL.ORIGINAL_AMOUNT];
  });
};

/**
 * Create a new debt object
 * @param {Object} debtData - Debt data
 * @returns {Object} New debt with generated ID
 */
export const createDebt = (debtData) => {
  return {
    [COL.DEBT_ID]: debtData[COL.DEBT_ID] || generateDebtId(),
    [COL.PERSON]: debtData[COL.PERSON] || '',
    [COL.DEBT_CATEGORY]: debtData[COL.DEBT_CATEGORY] || 'Cash',
    [COL.DIRECTION]: debtData[COL.DIRECTION] || DEBT_DIRECTION.LENT,
    [COL.ORIGINAL_AMOUNT]: Number(debtData[COL.ORIGINAL_AMOUNT]) || 0,
    [COL.DATE]: debtData[COL.DATE] || new Date().toISOString().split('T')[0],
    [COL.DUE_DATE]: debtData[COL.DUE_DATE] || '',
    [COL.NOTES]: debtData[COL.NOTES] || '',
  };
};

/**
 * Calculate total debt summary
 * @param {Array} debts - Array of debt objects
 * @param {Array} returns - Array of debt returns
 * @returns {{ totalLent: number, totalBorrowed: number, count: number }}
 */
export const calculateDebtSummary = (debts, returns = []) => {
  let totalLent = 0;
  let totalBorrowed = 0;
  
  debts.forEach(debt => {
    const remaining = calculateRemainingDebt(debt, returns);
    
    if (debt[COL.DIRECTION] === DEBT_DIRECTION.LENT) {
      totalLent += remaining;
    } else {
      totalBorrowed += remaining;
    }
  });
  
  return {
    totalLent,
    totalBorrowed,
    count: debts.length,
  };
};

/**
 * Calculate remaining debt amount
 * @param {Object} debt - Debt object
 * @param {Array} returns - All debt returns
 * @returns {number} Remaining amount
 */
export const calculateRemainingDebt = (debt, returns = []) => {
  const debtId = debt[COL.DEBT_ID];
  const totalReturned = returns
    .filter(ret => ret[RET_COL.DEBT_ID] === debtId)
    .reduce((sum, ret) => sum + ret[RET_COL.AMOUNT], 0);
  
  return debt[COL.ORIGINAL_AMOUNT] - totalReturned;
};

/**
 * Create a new debt return object
 * @param {Object} returnData - Return data
 * @returns {Object} New debt return with generated ID
 */
export const createDebtReturn = (returnData) => {
  return {
    [RET_COL.RETURN_ID]: returnData[RET_COL.RETURN_ID] || generateReturnId(),
    [RET_COL.DEBT_ID]: returnData[RET_COL.DEBT_ID] || '',
    [RET_COL.DATE]: returnData[RET_COL.DATE] || new Date().toISOString().split('T')[0],
    [RET_COL.AMOUNT]: Number(returnData[RET_COL.AMOUNT]) || 0,
    [RET_COL.NOTES]: returnData[RET_COL.NOTES] || '',
  };
};
