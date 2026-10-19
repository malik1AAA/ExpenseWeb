/**
 * Bulk Repayment Service
 * 
 * Handles bulk repayment allocation for a person with multiple outstanding debts.
 * 
 * Two modes:
 *   1. PREVIEW (client-side): Calculates allocation for UI preview without saving.
 *      Uses the same algorithm as the server RPC so the preview matches the final result.
 *   2. COMMIT (server-side): Calls the Supabase RPC `bulk_repay_person` which
 *      atomically validates and inserts all debt_returns in a single transaction.
 * 
 * Allocation algorithm:
 *   - Filter debts by person, direction, debt_category, user
 *   - Exclude debts with remaining <= 0
 *   - Sort by date ASC, then debt_id ASC (deterministic tie-breaker)
 *   - Allocate payment oldest-first, never exceeding a debt's remaining
 *   - Continue until payment exhausted or all debts settled
 */

import { supabase } from '../lib/supabaseClient';
import { COLUMNS } from '../config/excelSchema';
import { calculateRemainingDebt } from './debtService';

const DEBT_COL = COLUMNS.DEBTS;
const RETURN_COL = COLUMNS.DEBT_RETURNS;

/**
 * Get eligible debts for bulk repayment
 * Filters by person, direction, debt_category and excludes fully-paid debts.
 * Sorts by date ASC, debt_id ASC for deterministic ordering.
 * 
 * @param {Array} debts - All debts
 * @param {Array} debtReturns - All debt returns
 * @param {string} person - Person name
 * @param {string} direction - 'Lent' or 'Borrowed'
 * @param {string} debtCategory - 'Food' or 'Cash'
 * @returns {Array} Eligible debts with remaining balance, sorted oldest-first
 */
export const getEligibleDebts = (debts, debtReturns, person, direction, debtCategory) => {
  if (!person || !direction || !debtCategory) return [];

  return debts
    .filter((debt) => {
      // Must match person, direction, and debt_category
      if (debt[DEBT_COL.PERSON] !== person) return false;
      if (debt[DEBT_COL.DIRECTION] !== direction) return false;
      if (debt[DEBT_COL.DEBT_CATEGORY] !== debtCategory) return false;

      // Must have outstanding balance
      const remaining = calculateRemainingDebt(debt, debtReturns);
      return remaining > 0;
    })
    .map((debt) => ({
      debt,
      remaining: calculateRemainingDebt(debt, debtReturns),
    }))
    .sort((a, b) => {
      // Primary sort: date ASC
      const dateA = new Date(a.debt[DEBT_COL.DATE] || 0);
      const dateB = new Date(b.debt[DEBT_COL.DATE] || 0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // Tie-breaker: debt_id ASC (deterministic)
      const idA = a.debt[DEBT_COL.DEBT_ID] || '';
      const idB = b.debt[DEBT_COL.DEBT_ID] || '';
      return idA.localeCompare(idB);
    });
};

/**
 * Calculate total outstanding for eligible debts
 * 
 * @param {Array} eligibleDebts - From getEligibleDebts
 * @returns {number} Total outstanding balance
 */
export const calculateTotalOutstanding = (eligibleDebts) => {
  return eligibleDebts.reduce((sum, item) => sum + item.remaining, 0);
};

/**
 * Preview allocation (client-side)
 * 
 * Calculates how a payment would be distributed across eligible debts.
 * Uses the same algorithm as the server RPC.
 * 
 * @param {Array} eligibleDebts - From getEligibleDebts (already sorted)
 * @param {number} paymentAmount - Total payment amount
 * @returns {{ 
 *   allocations: Array<{debt, allocated, remainingBefore, remainingAfter}>,
 *   totalAllocated: number,
 *   unallocated: number,
 *   isValid: boolean,
 *   error: string|null
 * }}
 */
export const previewAllocation = (eligibleDebts, paymentAmount) => {
  // Validate payment amount
  if (!paymentAmount || paymentAmount <= 0) {
    return {
      allocations: [],
      totalAllocated: 0,
      unallocated: paymentAmount || 0,
      isValid: false,
      error: 'Payment amount must be greater than zero',
    };
  }

  const totalOutstanding = calculateTotalOutstanding(eligibleDebts);

  if (paymentAmount > totalOutstanding) {
    return {
      allocations: [],
      totalAllocated: 0,
      unallocated: paymentAmount,
      isValid: false,
      error: `Payment amount (${paymentAmount}) exceeds total outstanding (${totalOutstanding})`,
    };
  }

  if (eligibleDebts.length === 0) {
    return {
      allocations: [],
      totalAllocated: 0,
      unallocated: paymentAmount,
      isValid: false,
      error: 'No eligible debts found for this person, direction, and category',
    };
  }

  // Allocate payment oldest-first
  const allocations = [];
  let remainingPayment = paymentAmount;

  for (const item of eligibleDebts) {
    if (remainingPayment <= 0) break;

    const allocated = Math.min(remainingPayment, item.remaining);
    allocations.push({
      debt: item.debt,
      allocated,
      remainingBefore: item.remaining,
      remainingAfter: item.remaining - allocated,
    });
    remainingPayment -= allocated;
  }

  return {
    allocations,
    totalAllocated: paymentAmount - remainingPayment,
    unallocated: remainingPayment,
    isValid: true,
    error: null,
  };
};

/**
 * Commit bulk repayment (server-side)
 * 
 * Calls the Supabase RPC `bulk_repay_person` which atomically:
 *   - Re-validates the payment amount against outstanding balance
 *   - Inserts all debt_returns rows in a single transaction
 *   - Returns allocation details
 * 
 * If the RPC fails, NO rows are inserted (atomic transaction).
 * 
 * @param {Object} params
 * @param {string} params.person - Person name
 * @param {string} params.direction - 'Lent' or 'Borrowed'
 * @param {string} params.debtCategory - 'Food' or 'Cash'
 * @param {number} params.totalAmount - Total payment amount
 * @param {string} params.date - Repayment date (YYYY-MM-DD)
 * @param {string} params.notes - Optional notes (shared across all returns)
 * @returns {Promise<Object>} Allocation result from RPC
 */
export const commitBulkRepayment = async ({ person, direction, debtCategory, totalAmount, date, notes }) => {
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Call the RPC function
  const { data, error } = await supabase.rpc('bulk_repay_person', {
    p_person: person,
    p_direction: direction,
    p_debt_category: debtCategory,
    p_total_amount: totalAmount,
    p_date: date,
    p_notes: notes || null,
  });

  if (error) {
    throw new Error(error.message || 'Bulk repayment failed');
  }

  if (!data || !data.success) {
    throw new Error('Bulk repayment returned unsuccessful result');
  }

  return data;
};

/**
 * Get unique persons from debts
 * 
 * @param {Array} debts - All debts
 * @returns {Array<string>} Unique person names, sorted
 */
export const getUniquePersons = (debts) => {
  const persons = new Set();
  debts.forEach((debt) => {
    const person = debt[DEBT_COL.PERSON];
    if (person && person.trim()) {
      persons.add(person.trim());
    }
  });
  return Array.from(persons).sort();
};
