import { useContext, useMemo } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { 
  calculateTotalExpenses, 
  groupByCategory,
  getTopCategories,
  getCategoryName as getCategoryNameFromList
} from '../services/calculationService';
import { calculateRemainingDebt, calculateDebtSummary } from '../services/debtService';
import { COLUMNS } from '../config/excelSchema';

/**
 * Custom hook for accessing finance data and actions
 * Provides computed values and convenience methods
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
    isLoading 
  } = context;

  // Computed values
  const totalExpenses = useMemo(() => 
    calculateTotalExpenses(expenses),
    [expenses]
  );

  const categoryBreakdown = useMemo(() => 
    groupByCategory(expenses),
    [expenses]
  );

  const topCategories = useMemo(() => 
    getTopCategories(expenses, 5),
    [expenses]
  );

  const recentExpenses = useMemo(() => 
    [...expenses]
      .sort((a, b) => new Date(b[COLUMNS.EXPENSES.DATE]) - new Date(a[COLUMNS.EXPENSES.DATE]))
      .slice(0, 10),
    [expenses]
  );

  const debtSummary = useMemo(() => 
    calculateDebtSummary(debts, debtReturns),
    [debts, debtReturns]
  );

  // Helper functions
  const getCategoryName = (categoryId) => {
    return getCategoryNameFromList(categories, categoryId);
  };

  const getCategoryColor = (categoryId) => {
    // Simple color mapping based on category index
    const colors = [
      '#f97316', '#3b82f6', '#8b5cf6', '#eab308', 
      '#ec4899', '#10b981', '#6366f1', '#14b8a6'
    ];
    const index = categories.findIndex(
      c => c[COLUMNS.CATEGORIES.CATEGORY_ID] === categoryId
    );
    return colors[index % colors.length] || '#64748b';
  };

  const getRemainingDebt = (debt) => {
    return calculateRemainingDebt(debt, debtReturns);
  };

  return {
    // Raw data
    expenses,
    debts,
    debtReturns,
    categories,
    isLoading,
    
    // Computed values
    totalExpenses,
    categoryBreakdown,
    topCategories,
    recentExpenses,
    debtSummary,
    
    // Actions (from context)
    addExpense: context.addExpense,
    updateExpense: context.updateExpense,
    deleteExpense: context.deleteExpense,
    importExpenses: context.importExpenses,
    addDebt: context.addDebt,
    updateDebt: context.updateDebt,
    deleteDebt: context.deleteDebt,
    addDebtReturn: context.addDebtReturn,
    deleteDebtReturn: context.deleteDebtReturn,
    addCategory: context.addCategory,
    setLoading: context.setLoading,
    
    // Helpers
    getCategoryName,
    getCategoryColor,
    getRemainingDebt,
  };
}
