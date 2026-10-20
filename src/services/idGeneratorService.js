/**
 * ID Generation Service
 * Generates sequential IDs for expenses, debts, and debt returns
 * Format: EXPENSE_1, EXPENSE_2, DEBT_1, DEBT_2, RETURN_1, RETURN_2
 * 
 * IDs are now generated atomically in the database using sequences
 * to prevent duplicates in concurrent scenarios.
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Generate next sequential expense ID
 * Calls database function to get next ID atomically
 * @returns {Promise<string>} Expense ID in format EXPENSE_1, EXPENSE_2, etc.
 */
export const generateExpenseId = async () => {
  try {
    const { data, error } = await supabase.rpc('generate_next_expense_id');
    
    if (error) {
      console.error('Error generating expense ID:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to generate expense ID:', error);
    throw new Error('Failed to generate expense ID');
  }
};

/**
 * Generate next sequential debt ID
 * Calls database function to get next ID atomically
 * @returns {Promise<string>} Debt ID in format DEBT_1, DEBT_2, etc.
 */
export const generateDebtId = async () => {
  try {
    const { data, error } = await supabase.rpc('generate_next_debt_id');
    
    if (error) {
      console.error('Error generating debt ID:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to generate debt ID:', error);
    throw new Error('Failed to generate debt ID');
  }
};

/**
 * Generate next sequential return ID
 * Calls database function to get next ID atomically
 * @returns {Promise<string>} Return ID in format RETURN_1, RETURN_2, etc.
 */
export const generateReturnId = async () => {
  try {
    const { data, error } = await supabase.rpc('generate_next_return_id');
    
    if (error) {
      console.error('Error generating return ID:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to generate return ID:', error);
    throw new Error('Failed to generate return ID');
  }
};

/**
 * Get current sequence values from database (for debugging)
 * @returns {Promise<Object>} Current sequence values
 */
export const getCurrentCounters = async () => {
  try {
    const { data: expenseData, error: expenseError } = await supabase
      .rpc('currval', { sequence_name: 'public.expense_id_seq_global' })
      .single();
    
    const { data: debtData, error: debtError } = await supabase
      .rpc('currval', { sequence_name: 'public.debt_id_seq_global' })
      .single();
    
    const { data: returnData, error: returnError } = await supabase
      .rpc('currval', { sequence_name: 'public.return_id_seq_global' })
      .single();
    
    return {
      expense: expenseError ? 0 : expenseData,
      debt: debtError ? 0 : debtData,
      return: returnError ? 0 : returnData,
    };
  } catch (error) {
    console.error('Error getting current counters:', error);
    return { expense: 0, debt: 0, return: 0 };
  }
};

/**
 * Sync function - no longer needed with database sequences
 * Kept for backward compatibility but does nothing
 * @param {Array} expenses - Array of expense objects (unused)
 * @param {Array} debts - Array of debt objects (unused)
 * @param {Array} debtReturns - Array of debt return objects (unused)
 * @returns {Promise<Object>} Empty counters object
 */
export const syncCountersWithData = async (expenses = [], debts = [], debtReturns = []) => {
  // No longer needed - sequences are managed in database
  return { expense: 0, debt: 0, return: 0 };
};
