import { createContext, useState, useCallback } from 'react';
import {
  sampleExpenses,
  sampleDebts,
  sampleDebtReturns,
  sampleCategories,
} from '../data/sampleData';
import { COLUMNS } from '../config/excelSchema';

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
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  // On first render, load sample data (used when no Excel file has been imported).
  // Once importFinanceData() is called, these arrays are replaced with Excel data.
  const [expenses, setExpenses] = useState(sampleExpenses);
  const [debts, setDebts] = useState(sampleDebts);
  const [debtReturns, setDebtReturns] = useState(sampleDebtReturns);
  const [categories, setCategories] = useState(sampleCategories);

  // Name of the currently loaded Excel file. Null = using sample data.
  const [currentExcelFileName, setCurrentExcelFileName] = useState(null);

  // Loading flag for async operations (e.g., file parsing).
  const [loading, setLoading] = useState(false);

  // Array of error strings from the most recent operation.
  const [errors, setErrors] = useState([]);

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
   * Replace all financial data with imported data from an Excel file.
   *
   * @param {{
   *   expenses?: Array,
   *   debts?: Array,
   *   debtReturns?: Array,
   *   categories?: Array,
   *   fileName?: string,
   *   errors?: string[]
   * }} data
   */
  const importFinanceData = useCallback((data) => {
    if (!data || typeof data !== 'object') {
      setErrors(['Invalid data provided to importFinanceData']);
      return;
    }

    // If the caller passed errors from the Excel service, surface them.
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      setErrors(data.errors);
      // Still load whatever data is available so the UI isn't blank.
    } else {
      setErrors([]);
    }

    setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
    setDebts(Array.isArray(data.debts) ? data.debts : []);
    setDebtReturns(Array.isArray(data.debtReturns) ? data.debtReturns : []);
    setCategories(Array.isArray(data.categories) ? data.categories : []);
    setCurrentExcelFileName(data.fileName || null);
  }, []);

  /**
   * Clear all data and reset to sample data (as if no Excel has been imported).
   */
  const clearAllData = useCallback(() => {
    setExpenses(sampleExpenses);
    setDebts(sampleDebts);
    setDebtReturns(sampleDebtReturns);
    setCategories(sampleCategories);
    setCurrentExcelFileName(null);
    setErrors([]);
  }, []);

  // ---------------------------------------------------------------------------
  // Expenses CRUD
  // ---------------------------------------------------------------------------

  const addExpense = useCallback(
    (expense) => {
      if (!expense) return null;
      const newExpense = {
        ...expense,
        [EXPENSE_ID]: expense[EXPENSE_ID] || generateId('EXP'),
      };
      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    },
    [generateId]
  );

  const updateExpense = useCallback((id, expense) => {
    if (!id || !expense) return;
    setExpenses((prev) =>
      prev.map((e) => (e[EXPENSE_ID] === id ? { ...e, ...expense } : e))
    );
  }, []);

  const deleteExpense = useCallback((id) => {
    if (!id) return;
    setExpenses((prev) => prev.filter((e) => e[EXPENSE_ID] !== id));
  }, []);

  // ---------------------------------------------------------------------------
  // Debts CRUD
  // ---------------------------------------------------------------------------

  const addDebt = useCallback(
    (debt) => {
      if (!debt) return null;
      const newDebt = {
        ...debt,
        [DEBT_ID]: debt[DEBT_ID] || generateId('DEBT'),
      };
      setDebts((prev) => [newDebt, ...prev]);
      return newDebt;
    },
    [generateId]
  );

  const updateDebt = useCallback((id, debt) => {
    if (!id || !debt) return;
    setDebts((prev) =>
      prev.map((d) => (d[DEBT_ID] === id ? { ...d, ...debt } : d))
    );
  }, []);

  const deleteDebt = useCallback((id) => {
    if (!id) return;
    setDebts((prev) => prev.filter((d) => d[DEBT_ID] !== id));
  }, []);

  // ---------------------------------------------------------------------------
  // Debt Returns CRUD
  // ---------------------------------------------------------------------------

  const addDebtReturn = useCallback(
    (returnEntry) => {
      if (!returnEntry) return null;
      const newReturn = {
        ...returnEntry,
        [RETURN_ID]: returnEntry[RETURN_ID] || generateId('RET'),
      };
      setDebtReturns((prev) => [newReturn, ...prev]);
      return newReturn;
    },
    [generateId]
  );

  const deleteDebtReturn = useCallback((id) => {
    if (!id) return;
    setDebtReturns((prev) => prev.filter((r) => r[RETURN_ID] !== id));
  }, []);

  // ---------------------------------------------------------------------------
  // Categories CRUD
  // ---------------------------------------------------------------------------

  const addCategory = useCallback(
    (category) => {
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
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    },
    [generateId]
  );

  const updateCategory = useCallback((id, category) => {
    if (!id || !category) return;
    setCategories((prev) =>
      prev.map((c) => (c[CATEGORY_ID] === id ? { ...c, ...category } : c))
    );
  }, []);

  const deleteCategory = useCallback((id) => {
    if (!id) return;
    setCategories((prev) => prev.filter((c) => c[CATEGORY_ID] !== id));
  }, []);

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
