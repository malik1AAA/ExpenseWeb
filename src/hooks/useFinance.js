import { useContext, useMemo, useCallback } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import {
  getTotalExpenses,
  getCategoryTotals,
  getCurrentYearMonth,
} from '../services/calculationService';
import { calculateRemainingDebt, calculateDebtSummary } from '../services/debtService';
import { COLUMNS } from '../config/excelSchema';

/**
 * useFinance - Custom hook for accessing finance state and actions
 *
 * Provides:
 *   - All state from FinanceContext
 *   - All CRUD actions from FinanceContext
 *   - Computed/derived values (calculated here, not stored in context)
 *   - Helper functions for UI components
 *
 * Calculations are performed by calculationService.js and debtService.js.
 * This hook only composes them with context state.
 */
export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }

  const {
    expenses,
    debts,
    debtReturns,
    categories,
    currentExcelFileName,
    loading,
    errors,
  } = context;

  // ---------------------------------------------------------------------------
  // Computed values (derived from state, calculated on each render)
  // ---------------------------------------------------------------------------

  const totalExpenses = useMemo(
    () => getTotalExpenses(expenses),
    [expenses]
  );

  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  const categoryBreakdown = useMemo(
    () => getCategoryTotals(expenses, currentYear, currentMonth),
    [expenses, currentYear, currentMonth]
  );

  const topCategories = useMemo(() => {
    const totals = getCategoryTotals(expenses, currentYear, currentMonth);
    return Object.entries(totals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [expenses, currentYear, currentMonth]);

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort(
          (a, b) =>
            new Date(b[COLUMNS.EXPENSES.DATE]) -
            new Date(a[COLUMNS.EXPENSES.DATE])
        )
        .slice(0, 10),
    [expenses]
  );

  const debtSummary = useMemo(
    () => calculateDebtSummary(debts, debtReturns),
    [debts, debtReturns]
  );

  // ---------------------------------------------------------------------------
  // Helper functions (memoized to prevent unnecessary re-renders)
  // ---------------------------------------------------------------------------

  // Create a category map for O(1) lookups instead of O(n) find operations
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat[COLUMNS.CATEGORIES.CATEGORY_ID], cat);
    });
    return map;
  }, [categories]);

  /**
   * Get category display name by ID
   * @param {string} categoryId
   * @returns {string}
   */
  const getCategoryName = useCallback(
    (categoryId) => {
      const category = categoryMap.get(categoryId);
      return category ? category[COLUMNS.CATEGORIES.CATEGORY_NAME] : categoryId;
    },
    [categoryMap]
  );

  /**
   * Get a consistent color for a category
   * @param {string} categoryId
   * @returns {string} Hex color
   */
  const getCategoryColor = useCallback(
    (categoryId) => {
      const colors = [
        '#f97316',
        '#3b82f6',
        '#8b5cf6',
        '#eab308',
        '#ec4899',
        '#10b981',
        '#6366f1',
        '#14b8a6',
      ];
      const index = categories.findIndex(
        (c) => c[COLUMNS.CATEGORIES.CATEGORY_ID] === categoryId
      );
      return colors[index % colors.length] || '#64748b';
    },
    [categories]
  );

  /**
   * Calculate remaining balance for a debt
   * @param {Object} debt - Debt object
   * @returns {number}
   */
  const getRemainingDebt = useCallback(
    (debt) => {
      return calculateRemainingDebt(debt, debtReturns);
    },
    [debtReturns]
  );

  /**
   * Check if data is from sample (no Excel imported)
   * @returns {boolean}
   */
  const isUsingSampleData = !currentExcelFileName;

  // ---------------------------------------------------------------------------
  // Return value
  // ---------------------------------------------------------------------------

  return {
    // State (from context)
    expenses,
    debts,
    debtReturns,
    categories,
    currentExcelFileName,
    loading,
    errors,
    dataLoaded: context.dataLoaded,

    // Computed values (derived)
    totalExpenses,
    categoryBreakdown,
    topCategories,
    recentExpenses,
    debtSummary,
    isUsingSampleData,

    // Actions (from context)
    importFinanceData: context.importFinanceData,
    clearAllData: context.clearAllData,

    addExpense: context.addExpense,
    updateExpense: context.updateExpense,
    deleteExpense: context.deleteExpense,

    addDebt: context.addDebt,
    updateDebt: context.updateDebt,
    deleteDebt: context.deleteDebt,

    addDebtReturn: context.addDebtReturn,
    deleteDebtReturn: context.deleteDebtReturn,

    addCategory: context.addCategory,
    updateCategory: context.updateCategory,
    deleteCategory: context.deleteCategory,

    // Utilities (from context)
    setLoading: context.setLoading,
    setErrors: context.setErrors,
    clearErrors: context.clearErrors,

    // Helpers
    getCategoryName,
    getCategoryColor,
    getRemainingDebt,
  };
}
