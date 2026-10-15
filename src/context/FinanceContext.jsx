import { createContext, useState, useCallback } from 'react';
import { sampleExpenses, sampleIncome, sampleDebts, sampleCategories } from '../data/sampleData';
import { createExpense, updateExpense } from '../services/expenseService';
import { createDebt } from '../services/debtService';

/**
 * Finance Context - Global state management for the finance application
 */
export const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  // State
  const [transactions, setTransactions] = useState([...sampleIncome, ...sampleExpenses]);
  const [debts, setDebts] = useState(sampleDebts);
  const [categories, setCategories] = useState(sampleCategories);
  const [isLoading, setIsLoading] = useState(false);

  // Transaction actions
  const addTransaction = useCallback((transactionData) => {
    const newTransaction = transactionData.type === 'income' 
      ? { ...transactionData, id: Date.now().toString(36) + Math.random().toString(36).substr(2) }
      : createExpense(transactionData);
    
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  }, []);

  const updateTransaction = useCallback((id, updates) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? updateExpense(t, updates) : t)
    );
  }, []);

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const importTransactions = useCallback((newTransactions) => {
    setTransactions(prev => [...newTransactions, ...prev]);
  }, []);

  // Debt actions
  const addDebt = useCallback((debtData) => {
    const newDebt = createDebt(debtData);
    setDebts(prev => [newDebt, ...prev]);
    return newDebt;
  }, []);

  const updateDebt = useCallback((id, updates) => {
    setDebts(prev => 
      prev.map(d => d.id === id ? { ...d, ...updates } : d)
    );
  }, []);

  const deleteDebt = useCallback((id) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  // Category actions
  const addCategory = useCallback((categoryData) => {
    const newCategory = {
      id: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
      ...categoryData,
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
    transactions,
    debts,
    categories,
    isLoading,
    
    // Transaction actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    
    // Debt actions
    addDebt,
    updateDebt,
    deleteDebt,
    
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
