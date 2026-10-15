import { createContext, useState, useCallback } from 'react';
import { 
  sampleExpenses, 
  sampleDebts, 
  sampleDebtReturns, 
  sampleCategories 
} from '../data/sampleData';
import { createExpense, updateExpense } from '../services/expenseService';
import { createDebt, createDebtReturn } from '../services/debtService';
import { COLUMNS } from '../config/excelSchema';

/**
 * Finance Context - Global state management for the finance application
 */
export const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  // State
  const [expenses, setExpenses] = useState(sampleExpenses);
  const [debts, setDebts] = useState(sampleDebts);
  const [debtReturns, setDebtReturns] = useState(sampleDebtReturns);
  const [categories, setCategories] = useState(sampleCategories);
  const [isLoading, setIsLoading] = useState(false);

  // Expense actions
  const addExpense = useCallback((expenseData) => {
    const newExpense = createExpense(expenseData);
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  }, []);

  const updateExpenseById = useCallback((expenseId, updates) => {
    setExpenses(prev => 
      prev.map(e => e[COLUMNS.EXPENSES.EXPENSE_ID] === expenseId 
        ? updateExpense(e, updates) 
        : e
      )
    );
  }, []);

  const deleteExpense = useCallback((expenseId) => {
    setExpenses(prev => 
      prev.filter(e => e[COLUMNS.EXPENSES.EXPENSE_ID] !== expenseId)
    );
  }, []);

  const importExpenses = useCallback((newExpenses) => {
    setExpenses(prev => [...newExpenses, ...prev]);
  }, []);

  // Debt actions
  const addDebt = useCallback((debtData) => {
    const newDebt = createDebt(debtData);
    setDebts(prev => [newDebt, ...prev]);
    return newDebt;
  }, []);

  const updateDebtById = useCallback((debtId, updates) => {
    setDebts(prev => 
      prev.map(d => d[COLUMNS.DEBTS.DEBT_ID] === debtId 
        ? { ...d, ...updates } 
        : d
      )
    );
  }, []);

  const deleteDebt = useCallback((debtId) => {
    setDebts(prev => 
      prev.filter(d => d[COLUMNS.DEBTS.DEBT_ID] !== debtId)
    );
  }, []);

  // Debt Return actions
  const addDebtReturn = useCallback((returnData) => {
    const newReturn = createDebtReturn(returnData);
    setDebtReturns(prev => [newReturn, ...prev]);
    return newReturn;
  }, []);

  const deleteDebtReturn = useCallback((returnId) => {
    setDebtReturns(prev => 
      prev.filter(r => r[COLUMNS.DEBT_RETURNS.RETURN_ID] !== returnId)
    );
  }, []);

  // Category actions
  const addCategory = useCallback((categoryData) => {
    const newCategory = {
      [COLUMNS.CATEGORIES.CATEGORY_ID]: categoryData[COLUMNS.CATEGORIES.CATEGORY_ID] || 
        categoryData[COLUMNS.CATEGORIES.CATEGORY_NAME].toLowerCase().replace(/\s+/g, '-'),
      [COLUMNS.CATEGORIES.CATEGORY_NAME]: categoryData[COLUMNS.CATEGORIES.CATEGORY_NAME],
      [COLUMNS.CATEGORIES.TYPE]: categoryData[COLUMNS.CATEGORIES.TYPE] || 'Expense',
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  // Loading state
  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  // Context value
  const value = {
    // State
    expenses,
    debts,
    debtReturns,
    categories,
    isLoading,
    
    // Expense actions
    addExpense,
    updateExpense: updateExpenseById,
    deleteExpense,
    importExpenses,
    
    // Debt actions
    addDebt,
    updateDebt: updateDebtById,
    deleteDebt,
    
    // Debt Return actions
    addDebtReturn,
    deleteDebtReturn,
    
    // Category actions
    addCategory,
    
    // Utility
    setLoading,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}
