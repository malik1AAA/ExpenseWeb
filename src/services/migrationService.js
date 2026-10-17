/**
 * Migration Service
 * Helps users migrate data from localStorage to Supabase
 */

import { supabase } from '../lib/supabaseClient';
import { COLUMNS } from '../config/excelSchema';

const LOCAL_STORAGE_KEYS = {
  EXPENSES: 'finance_expenses',
  DEBTS: 'finance_debts',
  DEBT_RETURNS: 'finance_debt_returns',
  CATEGORIES: 'finance_categories',
};

/**
 * Check if local data exists in localStorage
 * @returns {boolean} True if any local data exists
 */
export const hasLocalData = () => {
  try {
    const expenses = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES);
    const debts = localStorage.getItem(LOCAL_STORAGE_KEYS.DEBTS);
    const debtReturns = localStorage.getItem(LOCAL_STORAGE_KEYS.DEBT_RETURNS);
    const categories = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES);

    return Boolean(expenses || debts || debtReturns || categories);
  } catch (error) {
    console.error('Error checking local data:', error);
    return false;
  }
};

/**
 * Get local data from localStorage
 * @returns {Object} Local data object
 */
export const getLocalData = () => {
  try {
    const expenses = localStorage.getItem(LOCAL_STORAGE_KEYS.EXPENSES);
    const debts = localStorage.getItem(LOCAL_STORAGE_KEYS.DEBTS);
    const debtReturns = localStorage.getItem(LOCAL_STORAGE_KEYS.DEBT_RETURNS);
    const categories = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES);

    return {
      expenses: expenses ? JSON.parse(expenses) : [],
      debts: debts ? JSON.parse(debts) : [],
      debtReturns: debtReturns ? JSON.parse(debtReturns) : [],
      categories: categories ? JSON.parse(categories) : [],
    };
  } catch (error) {
    console.error('Error getting local data:', error);
    return {
      expenses: [],
      debts: [],
      debtReturns: [],
      categories: [],
    };
  }
};

/**
 * Get local data summary
 * @returns {Object} Summary of local data
 */
export const getLocalDataSummary = () => {
  const data = getLocalData();
  
  return {
    expenses: data.expenses.length,
    debts: data.debts.length,
    debtReturns: data.debtReturns.length,
    categories: data.categories.length,
    total: data.expenses.length + data.debts.length + data.debtReturns.length + data.categories.length,
  };
};

/**
 * Validate local data before migration
 * @returns {Object} Validation result
 */
export const validateLocalData = () => {
  const data = getLocalData();
  const errors = [];
  const warnings = [];

  // Validate expenses
  data.expenses.forEach((expense, index) => {
    if (!expense[COLUMNS.EXPENSES.EXPENSE_ID]) {
      warnings.push(`Expense ${index + 1}: Missing ExpenseID (will be auto-generated)`);
    }
    if (!expense[COLUMNS.EXPENSES.DATE]) {
      errors.push(`Expense ${index + 1}: Missing Date`);
    }
    if (!expense[COLUMNS.EXPENSES.DESCRIPTION]) {
      errors.push(`Expense ${index + 1}: Missing Description`);
    }
    if (!expense[COLUMNS.EXPENSES.CATEGORY]) {
      errors.push(`Expense ${index + 1}: Missing Category`);
    }
    if (expense[COLUMNS.EXPENSES.AMOUNT] === undefined || expense[COLUMNS.EXPENSES.AMOUNT] === null) {
      errors.push(`Expense ${index + 1}: Missing Amount`);
    }
  });

  // Validate debts
  data.debts.forEach((debt, index) => {
    if (!debt[COLUMNS.DEBTS.DEBT_ID]) {
      warnings.push(`Debt ${index + 1}: Missing DebtID (will be auto-generated)`);
    }
    if (!debt[COLUMNS.DEBTS.PERSON]) {
      errors.push(`Debt ${index + 1}: Missing Person`);
    }
    if (!debt[COLUMNS.DEBTS.DIRECTION]) {
      errors.push(`Debt ${index + 1}: Missing Direction`);
    }
    if (debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] === undefined || debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] === null) {
      errors.push(`Debt ${index + 1}: Missing OriginalAmount`);
    }
    if (!debt[COLUMNS.DEBTS.DATE]) {
      errors.push(`Debt ${index + 1}: Missing Date`);
    }
  });

  // Validate debt returns
  data.debtReturns.forEach((ret, index) => {
    if (!ret[COLUMNS.DEBT_RETURNS.RETURN_ID]) {
      warnings.push(`Debt Return ${index + 1}: Missing ReturnID (will be auto-generated)`);
    }
    if (!ret[COLUMNS.DEBT_RETURNS.DEBT_ID]) {
      errors.push(`Debt Return ${index + 1}: Missing DebtID`);
    }
    if (!ret[COLUMNS.DEBT_RETURNS.DATE]) {
      errors.push(`Debt Return ${index + 1}: Missing Date`);
    }
    if (ret[COLUMNS.DEBT_RETURNS.AMOUNT] === undefined || ret[COLUMNS.DEBT_RETURNS.AMOUNT] === null) {
      errors.push(`Debt Return ${index + 1}: Missing Amount`);
    }
  });

  // Validate categories
  data.categories.forEach((category, index) => {
    if (!category[COLUMNS.CATEGORIES.CATEGORY_ID]) {
      warnings.push(`Category ${index + 1}: Missing CategoryID (will be auto-generated)`);
    }
    if (!category[COLUMNS.CATEGORIES.CATEGORY_NAME]) {
      errors.push(`Category ${index + 1}: Missing CategoryName`);
    }
  });

  // Validate foreign key relationships
  const debtIds = new Set(data.debts.map(d => d[COLUMNS.DEBTS.DEBT_ID]));
  data.debtReturns.forEach((ret, index) => {
    const debtId = ret[COLUMNS.DEBT_RETURNS.DEBT_ID];
    if (debtId && !debtIds.has(debtId)) {
      errors.push(`Debt Return ${index + 1}: References non-existent debt "${debtId}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Migrate local data to Supabase
 * @param {Object} data - Data to migrate
 * @returns {Promise<Object>} Migration result
 */
export const migrateToSupabase = async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const result = {
    success: true,
    migrated: {
      expenses: 0,
      debts: 0,
      debtReturns: 0,
      categories: 0,
    },
    errors: [],
  };

  try {
    // Migrate categories first (no dependencies)
    if (data.categories && data.categories.length > 0) {
      const categoriesToInsert = data.categories.map(cat => ({
        user_id: user.id,
        category_id: cat[COLUMNS.CATEGORIES.CATEGORY_ID] || `cat_${Date.now()}_${Math.random()}`,
        category_name: cat[COLUMNS.CATEGORIES.CATEGORY_NAME],
        type: cat[COLUMNS.CATEGORIES.TYPE] || 'Expense',
      }));

      const { error } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (error) {
        result.errors.push(`Failed to migrate categories: ${error.message}`);
      } else {
        result.migrated.categories = categoriesToInsert.length;
      }
    }

    // Migrate expenses (no dependencies)
    if (data.expenses && data.expenses.length > 0) {
      const expensesToInsert = data.expenses.map(expense => ({
        user_id: user.id,
        expense_id: expense[COLUMNS.EXPENSES.EXPENSE_ID] || `exp_${Date.now()}_${Math.random()}`,
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

      if (error) {
        result.errors.push(`Failed to migrate expenses: ${error.message}`);
      } else {
        result.migrated.expenses = expensesToInsert.length;
      }
    }

    // Migrate debts (no dependencies)
    if (data.debts && data.debts.length > 0) {
      const debtsToInsert = data.debts.map(debt => ({
        user_id: user.id,
        debt_id: debt[COLUMNS.DEBTS.DEBT_ID] || `debt_${Date.now()}_${Math.random()}`,
        person: debt[COLUMNS.DEBTS.PERSON],
        debt_category: debt[COLUMNS.DEBTS.DEBT_CATEGORY] || 'Cash',
        direction: debt[COLUMNS.DEBTS.DIRECTION],
        original_amount: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT],
        date: debt[COLUMNS.DEBTS.DATE],
        due_date: debt[COLUMNS.DEBTS.DUE_DATE] || null,
        notes: debt[COLUMNS.DEBTS.NOTES] || null,
      }));

      const { error } = await supabase
        .from('debts')
        .insert(debtsToInsert);

      if (error) {
        result.errors.push(`Failed to migrate debts: ${error.message}`);
      } else {
        result.migrated.debts = debtsToInsert.length;
      }
    }

    // Migrate debt returns (depends on debts)
    if (data.debtReturns && data.debtReturns.length > 0) {
      const returnsToInsert = data.debtReturns.map(ret => ({
        user_id: user.id,
        return_id: ret[COLUMNS.DEBT_RETURNS.RETURN_ID] || `ret_${Date.now()}_${Math.random()}`,
        debt_id: ret[COLUMNS.DEBT_RETURNS.DEBT_ID],
        date: ret[COLUMNS.DEBT_RETURNS.DATE],
        amount: ret[COLUMNS.DEBT_RETURNS.AMOUNT],
        notes: ret[COLUMNS.DEBT_RETURNS.NOTES] || null,
      }));

      const { error } = await supabase
        .from('debt_returns')
        .insert(returnsToInsert);

      if (error) {
        result.errors.push(`Failed to migrate debt returns: ${error.message}`);
      } else {
        result.migrated.debtReturns = returnsToInsert.length;
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      migrated: result.migrated,
      errors: [`Migration failed: ${error.message}`],
    };
  }
};

/**
 * Clear local data from localStorage
 * @param {boolean} confirm - Must be true to actually clear data
 * @returns {boolean} True if cleared successfully
 */
export const clearLocalData = (confirm = false) => {
  if (!confirm) {
    console.warn('Clear local data requires confirmation');
    return false;
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.DEBTS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.DEBT_RETURNS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CATEGORIES);
    return true;
  } catch (error) {
    console.error('Error clearing local data:', error);
    return false;
  }
};

/**
 * Export local data to JSON for backup
 * @returns {string} JSON string of local data
 */
export const exportLocalData = () => {
  const data = getLocalData();
  return JSON.stringify(data, null, 2);
};

/**
 * Check if migration is needed
 * @returns {Promise<Object>} Migration status
 */
export const checkMigrationStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      needsMigration: false,
      hasLocalData: false,
      hasSupabaseData: false,
      message: 'User not authenticated',
    };
  }

  const localDataExists = hasLocalData();
  
  // Check if user has data in Supabase
  const { count: expenseCount } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const hasSupabaseData = expenseCount > 0;

  return {
    needsMigration: localDataExists && !hasSupabaseData,
    hasLocalData: localDataExists,
    hasSupabaseData: hasSupabaseData,
    localDataSummary: localDataExists ? getLocalDataSummary() : null,
    message: localDataExists && !hasSupabaseData
      ? 'You have local data that can be migrated to the cloud'
      : hasSupabaseData
      ? 'Your data is already in the cloud'
      : 'No data found',
  };
};
