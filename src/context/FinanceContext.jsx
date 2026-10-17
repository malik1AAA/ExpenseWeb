import { createContext, useState, useCallback, useEffect } from 'react';
import {
  sampleExpenses,
  sampleDebts,
  sampleDebtReturns,
  sampleCategories,
} from '../data/sampleData';
import { COLUMNS } from '../config/excelSchema';
import { syncCountersWithData } from '../services/idGeneratorService';
import { useAuth } from './AuthContext';
import * as supabaseService from '../services/supabaseDataService';

/**
 * FinanceContext - Pure state management for finance data
 *
 * State:
 *   expenses, debts, debtReturns, categories,
 *   currentExcelFileName, loading, errors
 *
 * Actions:
 *   importFinanceData, clearAllData,
 *   addExpense/updateExpense/deleteExpense,
 *   addDebt/updateDebt/deleteDebt,
 *   addDebtReturn/deleteDebtReturn,
 *   addCategory/updateCategory/deleteCategory
 *
 * Calculations belong in calculationService.js — this context
 * only stores and mutates state.
 */
export const FinanceContext = createContext(null);

// ID field references (from schema)
const EXPENSE_ID = COLUMNS.EXPENSES.EXPENSE_ID;
const DEBT_ID = COLUMNS.DEBTS.DEBT_ID;
const RETURN_ID = COLUMNS.DEBT_RETURNS.RETURN_ID;
const CATEGORY_ID = COLUMNS.CATEGORIES.CATEGORY_ID;

export function FinanceProvider({ children }) {
  const { user } = useAuth();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [debtReturns, setDebtReturns] = useState([]);
  const [categories, setCategories] = useState([]);

  const [currentExcelFileName, setCurrentExcelFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // ---------------------------------------------------------------------------
  // Load data from Supabase when user is authenticated
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        // User signed out - clear data
        setExpenses([]);
        setDebts([]);
        setDebtReturns([]);
        setCategories([]);
        setDataLoaded(false);
        return;
      }

      try {
        setLoading(true);
        setErrors([]);

        // Fetch all data from Supabase
        const [expensesData, debtsData, debtReturnsData, categoriesData] = await Promise.all([
          supabaseService.fetchExpenses(),
          supabaseService.fetchDebts(),
          supabaseService.fetchDebtReturns(),
          supabaseService.fetchCategories(),
        ]);

        setExpenses(expensesData);
        setDebts(debtsData);
        setDebtReturns(debtReturnsData);
        setCategories(categoriesData);

        // Sync ID counters with loaded data
        syncCountersWithData(expensesData, debtsData, debtReturnsData);

        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setErrors([`Failed to load data: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const clearErrors = useCallback(() => setErrors([]), []);

  /**
   * Generate a unique ID with a given prefix.
   * @param {string} prefix - e.g., 'EXP', 'DEBT', 'RET', 'CAT'
   * @returns {string}
   */
  const generateId = useCallback((prefix) => {
    return (
      prefix +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 7).toUpperCase()
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Import / Clear
  // ---------------------------------------------------------------------------

  /**
   * Import financial data from an Excel file.
   * Supports both replace and merge modes.
   * Saves to Supabase if user is authenticated.
   *
   * @param {{
   *   expenses?: Array,
   *   debts?: Array,
   *   debtReturns?: Array,
   *   categories?: Array,
   *   fileName?: string,
   *   errors?: string[]
   * }} data
   * @param {string} mode - 'replace' or 'merge'
   */
  const importFinanceData = useCallback(async (data, mode = 'replace') => {
    if (!data || typeof data !== 'object') {
      setErrors(['Invalid data provided to importFinanceData']);
      return;
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      setErrors(data.errors);
    } else {
      setErrors([]);
    }

    const newExpenses = Array.isArray(data.expenses) ? data.expenses : [];
    const newDebts = Array.isArray(data.debts) ? data.debts : [];
    const newDebtReturns = Array.isArray(data.debtReturns) ? data.debtReturns : [];
    const newCategories = Array.isArray(data.categories) ? data.categories : [];

    let finalExpenses, finalDebts, finalDebtReturns, finalCategories;

    if (mode === 'merge') {
      // Merge mode: combine existing data with new data, skip duplicates
      const existingExpenseIds = new Set(expenses.map(e => e[EXPENSE_ID]));
      const existingDebtIds = new Set(debts.map(d => d[DEBT_ID]));
      const existingReturnIds = new Set(debtReturns.map(r => r[RETURN_ID]));
      const existingCategoryIds = new Set(categories.map(c => c[CATEGORY_ID]));

      finalExpenses = [
        ...expenses,
        ...newExpenses.filter(e => !existingExpenseIds.has(e[EXPENSE_ID]))
      ];
      finalDebts = [
        ...debts,
        ...newDebts.filter(d => !existingDebtIds.has(d[DEBT_ID]))
      ];
      finalDebtReturns = [
        ...debtReturns,
        ...newDebtReturns.filter(r => !existingReturnIds.has(r[RETURN_ID]))
      ];
      finalCategories = [
        ...categories,
        ...newCategories.filter(c => !existingCategoryIds.has(c[CATEGORY_ID]))
      ];
    } else {
      // Replace mode: replace all data
      finalExpenses = newExpenses;
      finalDebts = newDebts;
      finalDebtReturns = newDebtReturns;
      finalCategories = newCategories;
    }

    // Update local state immediately
    setExpenses(finalExpenses);
    setDebts(finalDebts);
    setDebtReturns(finalDebtReturns);
    setCategories(finalCategories);
    setCurrentExcelFileName(data.fileName || null);

    // Sync ID counters
    syncCountersWithData(finalExpenses, finalDebts, finalDebtReturns);

    // Save to Supabase if user is authenticated
    if (user) {
      try {
        setLoading(true);
        
        if (mode === 'replace') {
          // Delete existing data first, then import new data
          await supabaseService.deleteAllData();
        }
        
        await supabaseService.importData({ 
          expenses: finalExpenses, 
          debts: finalDebts, 
          debtReturns: finalDebtReturns, 
          categories: finalCategories 
        });
      } catch (error) {
        console.error('Error saving to Supabase:', error);
        setErrors([`Failed to save data: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
  }, [user, expenses, debts, debtReturns, categories]);

  /**
   * Clear all data and reset to empty state.
   * Deletes from Supabase if user is authenticated.
   */
  const clearAllData = useCallback(async () => {
    setExpenses([]);
    setDebts([]);
    setDebtReturns([]);
    setCategories([]);
    setCurrentExcelFileName(null);
    setErrors([]);

    // Delete from Supabase if user is authenticated
    if (user) {
      try {
        setLoading(true);
        await supabaseService.deleteAllData();
      } catch (error) {
        console.error('Error deleting data:', error);
        setErrors([`Failed to delete data: ${error.message}`]);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Expenses CRUD
  // ---------------------------------------------------------------------------

  const addExpense = useCallback(
    async (expense) => {
      if (!expense) return null;
      const newExpense = {
        ...expense,
        [EXPENSE_ID]: expense[EXPENSE_ID] || generateId('EXP'),
      };
      
      // Update local state immediately
      setExpenses((prev) => [newExpense, ...prev]);
      
      // Save to Supabase if user is authenticated
      if (user) {
        try {
          await supabaseService.createExpense(newExpense);
        } catch (error) {
          console.error('Error creating expense:', error);
          setErrors([`Failed to save expense: ${error.message}`]);
          // Revert local state on error
          setExpenses((prev) => prev.filter((e) => e[EXPENSE_ID] !== newExpense[EXPENSE_ID]));
        }
      }
      
      return newExpense;
    },
    [generateId, user]
  );

  const updateExpense = useCallback(async (id, expense) => {
    if (!id || !expense) return;
    
    // Update local state immediately
    setExpenses((prev) =>
      prev.map((e) => (e[EXPENSE_ID] === id ? { ...e, ...expense } : e))
    );
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await supabaseService.updateExpense(id, expense);
      } catch (error) {
        console.error('Error updating expense:', error);
        setErrors([`Failed to update expense: ${error.message}`]);
      }
    }
  }, [user]);

  const deleteExpense = useCallback(async (id) => {
    if (!id) return;
    
    // Update local state immediately
    setExpenses((prev) => prev.filter((e) => e[EXPENSE_ID] !== id));
    
    // Delete from Supabase if user is authenticated
    if (user) {
      try {
        await supabaseService.deleteExpense(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
        setErrors([`Failed to delete expense: ${error.message}`]);
      }
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Debts CRUD
  // ---------------------------------------------------------------------------

  const addDebt = useCallback(
    async (debt) => {
      if (!debt) return null;
      const newDebt = {
        ...debt,
        [DEBT_ID]: debt[DEBT_ID] || generateId('DEBT'),
      };
      
      // Update local state immediately
      setDebts((prev) => [newDebt, ...prev]);
      
      // Save to Supabase if user is authenticated
      if (user) {
        try {
          await supabaseService.createDebt(newDebt);
        } catch (error) {
          console.error('Error creating debt:', error);
          setErrors([`Failed to save debt: ${error.message}`]);
          setDebts((prev) => prev.filter((d) => d[DEBT_ID] !== newDebt[DEBT_ID]));
        }
      }
      
      return newDebt;
    },
    [generateId, user]
  );

  const updateDebt = useCallback(async (id, debt) => {
    if (!id || !debt) return;
    
    // Update local state immediately
    setDebts((prev) =>
      prev.map((d) => (d[DEBT_ID] === id ? { ...d, ...debt } : d))
    );
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await supabaseService.updateDebt(id, debt);
      } catch (error) {
        console.error('Error updating debt:', error);
        setErrors([`Failed to update debt: ${error.message}`]);
      }
    }
  }, [user]);

  const deleteDebt = useCallback(async (id) => {
    if (!id) return;
    
    // Update local state immediately
    setDebts((prev) => prev.filter((d) => d[DEBT_ID] !== id));
    
    // Delete from Supabase if user is authenticated
    if (user) {
      try {
        await supabaseService.deleteDebt(id);
      } catch (error) {
        console.error('Error deleting debt:', error);
        setErrors([`Failed to delete debt: ${error.message}`]);
      }
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Debt Returns CRUD
  // ---------------------------------------------------------------------------

  const addDebtReturn = useCallback(
    async (returnEntry) => {
      if (!returnEntry) return null;
      const newReturn = {
        ...returnEntry,
        [RETURN_ID]: returnEntry[RETURN_ID] || generateId('RET'),
      };
      
      // Update local state immediately
      setDebtReturns((prev) => [newReturn, ...prev]);
      
      // Save to Supabase if user is authenticated
      if (user) {
        try {
          await supabaseService.createDebtReturn(newReturn);
        } catch (error) {
          console.error('Error creating debt return:', error);
          setErrors([`Failed to save debt return: ${error.message}`]);
          setDebtReturns((prev) => prev.filter((r) => r[RETURN_ID] !== newReturn[RETURN_ID]));
        }
      }
      
      return newReturn;
    },
    [generateId, user]
  );

  const deleteDebtReturn = useCallback(async (id) => {
    if (!id) return;
    
    // Update local state immediately
    setDebtReturns((prev) => prev.filter((r) => r[RETURN_ID] !== id));
    
    // Delete from Supabase if user is authenticated
    if (user) {
      try {
        await supabaseService.deleteDebtReturn(id);
      } catch (error) {
        console.error('Error deleting debt return:', error);
        setErrors([`Failed to delete debt return: ${error.message}`]);
      }
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Categories CRUD
  // ---------------------------------------------------------------------------

  const addCategory = useCallback(
    async (category) => {
      if (!category) return null;
      const newCategory = {
        ...category,
        [CATEGORY_ID]:
          category[CATEGORY_ID] ||
          (category[COLUMNS.CATEGORIES.CATEGORY_NAME] || '')
            .toLowerCase()
            .replace(/\s+/g, '-') ||
          generateId('CAT'),
      };
      
      // Update local state immediately
      setCategories((prev) => [...prev, newCategory]);
      
      // Save to Supabase if user is authenticated
      if (user) {
        try {
          await supabaseService.createCategory(newCategory);
        } catch (error) {
          console.error('Error creating category:', error);
          setErrors([`Failed to save category: ${error.message}`]);
          setCategories((prev) => prev.filter((c) => c[CATEGORY_ID] !== newCategory[CATEGORY_ID]));
        }
      }
      
      return newCategory;
    },
    [generateId, user]
  );

  const updateCategory = useCallback(async (id, category) => {
    if (!id || !category) return;
    
    // Update local state immediately
    setCategories((prev) =>
      prev.map((c) => (c[CATEGORY_ID] === id ? { ...c, ...category } : c))
    );
    
    // Save to Supabase if user is authenticated
    if (user) {
      try {
        await supabaseService.updateCategory(id, category);
      } catch (error) {
        console.error('Error updating category:', error);
        setErrors([`Failed to update category: ${error.message}`]);
      }
    }
  }, [user]);

  const deleteCategory = useCallback(async (id) => {
    if (!id) return;
    
    // Update local state immediately
    setCategories((prev) => prev.filter((c) => c[CATEGORY_ID] !== id));
    
    // Delete from Supabase if user is authenticated
    if (user) {
      try {
        await supabaseService.deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
        setErrors([`Failed to delete category: ${error.message}`]);
      }
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value = {
    // State
    expenses,
    debts,
    debtReturns,
    categories,
    currentExcelFileName,
    loading,
    errors,
    dataLoaded,

    // Import / Clear
    importFinanceData,
    clearAllData,

    // Expenses
    addExpense,
    updateExpense,
    deleteExpense,

    // Debts
    addDebt,
    updateDebt,
    deleteDebt,

    // Debt Returns
    addDebtReturn,
    deleteDebtReturn,

    // Categories
    addCategory,
    updateCategory,
    deleteCategory,

    // Utilities
    setLoading,
    setErrors,
    clearErrors,
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}
