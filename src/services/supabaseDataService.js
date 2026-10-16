/**
 * Supabase Data Service
 * Handles all CRUD operations with Supabase database
 * Ensures user data isolation and proper error handling
 */

import { supabase } from '../lib/supabaseClient';
import { COLUMNS } from '../config/excelSchema';

// ============================================================================
// EXPENSES
// ============================================================================

/**
 * Fetch all expenses for the current user
 * @returns {Promise<Array>} Array of expense objects
 */
export const fetchExpenses = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  
  // Transform to match app's expected format
  return data.map(row => ({
    [COLUMNS.EXPENSES.EXPENSE_ID]: row.expense_id,
    [COLUMNS.EXPENSES.DATE]: row.date,
    [COLUMNS.EXPENSES.DESCRIPTION]: row.description,
    [COLUMNS.EXPENSES.CATEGORY]: row.category,
    [COLUMNS.EXPENSES.AMOUNT]: parseFloat(row.amount),
    [COLUMNS.EXPENSES.PAYMENT_METHOD]: row.payment_method || '',
    [COLUMNS.EXPENSES.NOTES]: row.notes || '',
  }));
};

/**
 * Create a new expense
 * @param {Object} expense - Expense data
 * @returns {Promise<Object>} Created expense
 */
export const createExpense = async (expense) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      expense_id: expense[COLUMNS.EXPENSES.EXPENSE_ID],
      date: expense[COLUMNS.EXPENSES.DATE],
      description: expense[COLUMNS.EXPENSES.DESCRIPTION],
      category: expense[COLUMNS.EXPENSES.CATEGORY],
      amount: expense[COLUMNS.EXPENSES.AMOUNT],
      payment_method: expense[COLUMNS.EXPENSES.PAYMENT_METHOD] || null,
      notes: expense[COLUMNS.EXPENSES.NOTES] || null,
    })
    .select()
    .single();

  if (error) throw error;
  return expense;
};

/**
 * Update an existing expense
 * @param {string} expenseId - Business expense ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated expense
 */
export const updateExpense = async (expenseId, updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData = {};
  if (updates[COLUMNS.EXPENSES.DATE]) updateData.date = updates[COLUMNS.EXPENSES.DATE];
  if (updates[COLUMNS.EXPENSES.DESCRIPTION]) updateData.description = updates[COLUMNS.EXPENSES.DESCRIPTION];
  if (updates[COLUMNS.EXPENSES.CATEGORY]) updateData.category = updates[COLUMNS.EXPENSES.CATEGORY];
  if (updates[COLUMNS.EXPENSES.AMOUNT] !== undefined) updateData.amount = updates[COLUMNS.EXPENSES.AMOUNT];
  if (updates[COLUMNS.EXPENSES.PAYMENT_METHOD] !== undefined) updateData.payment_method = updates[COLUMNS.EXPENSES.PAYMENT_METHOD];
  if (updates[COLUMNS.EXPENSES.NOTES] !== undefined) updateData.notes = updates[COLUMNS.EXPENSES.NOTES];

  const { error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('user_id', user.id)
    .eq('expense_id', expenseId);

  if (error) throw error;
  return { ...updates, [COLUMNS.EXPENSES.EXPENSE_ID]: expenseId };
};

/**
 * Delete an expense
 * @param {string} expenseId - Business expense ID
 * @returns {Promise<void>}
 */
export const deleteExpense = async (expenseId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('user_id', user.id)
    .eq('expense_id', expenseId);

  if (error) throw error;
};

// ============================================================================
// DEBTS
// ============================================================================

/**
 * Fetch all debts for the current user
 * @returns {Promise<Array>} Array of debt objects
 */
export const fetchDebts = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  
  return data.map(row => ({
    [COLUMNS.DEBTS.DEBT_ID]: row.debt_id,
    [COLUMNS.DEBTS.PERSON]: row.person,
    [COLUMNS.DEBTS.DEBT_CATEGORY]: row.debt_category,
    [COLUMNS.DEBTS.DIRECTION]: row.direction,
    [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: parseFloat(row.original_amount),
    [COLUMNS.DEBTS.DATE]: row.date,
    [COLUMNS.DEBTS.DUE_DATE]: row.due_date,
    [COLUMNS.DEBTS.NOTES]: row.notes || '',
  }));
};

/**
 * Create a new debt
 * @param {Object} debt - Debt data
 * @returns {Promise<Object>} Created debt
 */
export const createDebt = async (debt) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('debts')
    .insert({
      user_id: user.id,
      debt_id: debt[COLUMNS.DEBTS.DEBT_ID],
      person: debt[COLUMNS.DEBTS.PERSON],
      debt_category: debt[COLUMNS.DEBTS.DEBT_CATEGORY],
      direction: debt[COLUMNS.DEBTS.DIRECTION],
      original_amount: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT],
      date: debt[COLUMNS.DEBTS.DATE],
      due_date: debt[COLUMNS.DEBTS.DUE_DATE] || null,
      notes: debt[COLUMNS.DEBTS.NOTES] || null,
    })
    .select()
    .single();

  if (error) throw error;
  return debt;
};

/**
 * Update an existing debt
 * @param {string} debtId - Business debt ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated debt
 */
export const updateDebt = async (debtId, updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData = {};
  if (updates[COLUMNS.DEBTS.PERSON]) updateData.person = updates[COLUMNS.DEBTS.PERSON];
  if (updates[COLUMNS.DEBTS.DEBT_CATEGORY]) updateData.debt_category = updates[COLUMNS.DEBTS.DEBT_CATEGORY];
  if (updates[COLUMNS.DEBTS.DIRECTION]) updateData.direction = updates[COLUMNS.DEBTS.DIRECTION];
  if (updates[COLUMNS.DEBTS.ORIGINAL_AMOUNT] !== undefined) updateData.original_amount = updates[COLUMNS.DEBTS.ORIGINAL_AMOUNT];
  if (updates[COLUMNS.DEBTS.DATE]) updateData.date = updates[COLUMNS.DEBTS.DATE];
  if (updates[COLUMNS.DEBTS.DUE_DATE] !== undefined) updateData.due_date = updates[COLUMNS.DEBTS.DUE_DATE];
  if (updates[COLUMNS.DEBTS.NOTES] !== undefined) updateData.notes = updates[COLUMNS.DEBTS.NOTES];

  const { error } = await supabase
    .from('debts')
    .update(updateData)
    .eq('user_id', user.id)
    .eq('debt_id', debtId);

  if (error) throw error;
  return { ...updates, [COLUMNS.DEBTS.DEBT_ID]: debtId };
};

/**
 * Delete a debt
 * @param {string} debtId - Business debt ID
 * @returns {Promise<void>}
 */
export const deleteDebt = async (debtId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('user_id', user.id)
    .eq('debt_id', debtId);

  if (error) throw error;
};

// ============================================================================
// DEBT RETURNS
// ============================================================================

/**
 * Fetch all debt returns for the current user
 * @returns {Promise<Array>} Array of debt return objects
 */
export const fetchDebtReturns = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('debt_returns')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) throw error;
  
  return data.map(row => ({
    [COLUMNS.DEBT_RETURNS.RETURN_ID]: row.return_id,
    [COLUMNS.DEBT_RETURNS.DEBT_ID]: row.debt_id,
    [COLUMNS.DEBT_RETURNS.DATE]: row.date,
    [COLUMNS.DEBT_RETURNS.AMOUNT]: parseFloat(row.amount),
    [COLUMNS.DEBT_RETURNS.NOTES]: row.notes || '',
  }));
};

/**
 * Create a new debt return
 * @param {Object} returnEntry - Debt return data
 * @returns {Promise<Object>} Created debt return
 */
export const createDebtReturn = async (returnEntry) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('debt_returns')
    .insert({
      user_id: user.id,
      return_id: returnEntry[COLUMNS.DEBT_RETURNS.RETURN_ID],
      debt_id: returnEntry[COLUMNS.DEBT_RETURNS.DEBT_ID],
      date: returnEntry[COLUMNS.DEBT_RETURNS.DATE],
      amount: returnEntry[COLUMNS.DEBT_RETURNS.AMOUNT],
      notes: returnEntry[COLUMNS.DEBT_RETURNS.NOTES] || null,
    })
    .select()
    .single();

  if (error) throw error;
  return returnEntry;
};

/**
 * Delete a debt return
 * @param {string} returnId - Business return ID
 * @returns {Promise<void>}
 */
export const deleteDebtReturn = async (returnId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('debt_returns')
    .delete()
    .eq('user_id', user.id)
    .eq('return_id', returnId);

  if (error) throw error;
};

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Fetch all categories for the current user
 * @returns {Promise<Array>} Array of category objects
 */
export const fetchCategories = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('category_name', { ascending: true });

  if (error) throw error;
  
  return data.map(row => ({
    [COLUMNS.CATEGORIES.CATEGORY_ID]: row.category_id,
    [COLUMNS.CATEGORIES.CATEGORY_NAME]: row.category_name,
    [COLUMNS.CATEGORIES.TYPE]: row.type,
  }));
};

/**
 * Create a new category
 * @param {Object} category - Category data
 * @returns {Promise<Object>} Created category
 */
export const createCategory = async (category) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      category_id: category[COLUMNS.CATEGORIES.CATEGORY_ID],
      category_name: category[COLUMNS.CATEGORIES.CATEGORY_NAME],
      type: category[COLUMNS.CATEGORIES.TYPE] || 'Expense',
    })
    .select()
    .single();

  if (error) throw error;
  return category;
};

/**
 * Update an existing category
 * @param {string} categoryId - Business category ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated category
 */
export const updateCategory = async (categoryId, updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updateData = {};
  if (updates[COLUMNS.CATEGORIES.CATEGORY_NAME]) {
    updateData.category_name = updates[COLUMNS.CATEGORIES.CATEGORY_NAME];
  }

  const { error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('user_id', user.id)
    .eq('category_id', categoryId);

  if (error) throw error;
  return { ...updates, [COLUMNS.CATEGORIES.CATEGORY_ID]: categoryId };
};

/**
 * Delete a category
 * @param {string} categoryId - Business category ID
 * @returns {Promise<void>}
 */
export const deleteCategory = async (categoryId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', user.id)
    .eq('category_id', categoryId);

  if (error) throw error;
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Import multiple records at once
 * @param {Object} data - Object with expenses, debts, debtReturns, categories arrays
 * @returns {Promise<Object>} Import results
 */
export const importData = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const results = {
    expenses: 0,
    debts: 0,
    debtReturns: 0,
    categories: 0,
  };

  // Import expenses
  if (data.expenses && data.expenses.length > 0) {
    const expensesToInsert = data.expenses.map(expense => ({
      user_id: user.id,
      expense_id: expense[COLUMNS.EXPENSES.EXPENSE_ID],
      date: expense[COLUMNS.EXPENSES.DATE],
      description: expense[COLUMNS.EXPENSES.DESCRIPTION],
      category: expense[COLUMNS.EXPENSES.CATEGORY],
      amount: expense[COLUMNS.EXPENSES.AMOUNT],
      payment_method: expense[COLUMNS.EXPENSES.PAYMENT_METHOD] || null,
      notes: expense[COLUMNS.EXPENSES.NOTES] || null,
    }));

    const { error } = await supabase
      .from('expenses')
      .insert(expensesToInsert);

    if (error) throw error;
    results.expenses = expensesToInsert.length;
  }

  // Import debts
  if (data.debts && data.debts.length > 0) {
    const debtsToInsert = data.debts.map(debt => ({
      user_id: user.id,
      debt_id: debt[COLUMNS.DEBTS.DEBT_ID],
      person: debt[COLUMNS.DEBTS.PERSON],
      debt_category: debt[COLUMNS.DEBTS.DEBT_CATEGORY],
      direction: debt[COLUMNS.DEBTS.DIRECTION],
      original_amount: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT],
      date: debt[COLUMNS.DEBTS.DATE],
      due_date: debt[COLUMNS.DEBTS.DUE_DATE] || null,
      notes: debt[COLUMNS.DEBTS.NOTES] || null,
    }));

    const { error } = await supabase
      .from('debts')
      .insert(debtsToInsert);

    if (error) throw error;
    results.debts = debtsToInsert.length;
  }

  // Import debt returns
  if (data.debtReturns && data.debtReturns.length > 0) {
    const returnsToInsert = data.debtReturns.map(ret => ({
      user_id: user.id,
      return_id: ret[COLUMNS.DEBT_RETURNS.RETURN_ID],
      debt_id: ret[COLUMNS.DEBT_RETURNS.DEBT_ID],
      date: ret[COLUMNS.DEBT_RETURNS.DATE],
      amount: ret[COLUMNS.DEBT_RETURNS.AMOUNT],
      notes: ret[COLUMNS.DEBT_RETURNS.NOTES] || null,
    }));

    const { error } = await supabase
      .from('debt_returns')
      .insert(returnsToInsert);

    if (error) throw error;
    results.debtReturns = returnsToInsert.length;
  }

  // Import categories
  if (data.categories && data.categories.length > 0) {
    const categoriesToInsert = data.categories.map(cat => ({
      user_id: user.id,
      category_id: cat[COLUMNS.CATEGORIES.CATEGORY_ID],
      category_name: cat[COLUMNS.CATEGORIES.CATEGORY_NAME],
      type: cat[COLUMNS.CATEGORIES.TYPE] || 'Expense',
    }));

    const { error } = await supabase
      .from('categories')
      .insert(categoriesToInsert);

    if (error) throw error;
    results.categories = categoriesToInsert.length;
  }

  return results;
};

/**
 * Delete all user data
 * @returns {Promise<void>}
 */
export const deleteAllData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Delete in order to respect foreign key constraints
  await supabase.from('debt_returns').delete().eq('user_id', user.id);
  await supabase.from('debts').delete().eq('user_id', user.id);
  await supabase.from('expenses').delete().eq('user_id', user.id);
  await supabase.from('categories').delete().eq('user_id', user.id);
};
