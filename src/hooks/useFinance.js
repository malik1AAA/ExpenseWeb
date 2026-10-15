import { useContext, useMemo } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { 
  calculateTotalIncome, 
  calculateTotalExpenses, 
  calculateBalance,
  groupByCategory,
  getTopCategories 
} from '../services/calculationService';

/**
 * Custom hook for accessing finance data and actions
 * Provides computed values and convenience methods
 */
export function useFinance() {
  const context = useContext(FinanceContext);
  
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }

  const { transactions, debts, categories, isLoading } = context;

  // Computed values
  const expenses = useMemo(() => 
    transactions.filter(t => t.type === 'expense'),
    [transactions]
  );

  const income = useMemo(() => 
    transactions.filter(t => t.type === 'income'),
    [transactions]
  );

  const totalIncome = useMemo(() => 
    calculateTotalIncome(transactions),
    [transactions]
  );

  const totalExpenses = useMemo(() => 
    calculateTotalExpenses(transactions),
    [transactions]
  );

  const balance = useMemo(() => 
    calculateBalance(transactions),
    [transactions]
  );

  const categoryBreakdown = useMemo(() => 
    groupByCategory(expenses),
    [expenses]
  );

  const topCategories = useMemo(() => 
    getTopCategories(expenses, 5),
    [expenses]
  );

  const recentTransactions = useMemo(() => 
    [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10),
    [transactions]
  );

  const activeDebts = useMemo(() => 
    debts.filter(d => d.status === 'active'),
    [debts]
  );

  const totalDebt = useMemo(() => 
    activeDebts.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0),
    [activeDebts]
  );

  // Helper functions
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#64748b';
  };

  return {
    // Raw data
    transactions,
    expenses,
    income,
    debts,
    activeDebts,
    categories,
    isLoading,
    
    // Computed values
    totalIncome,
    totalExpenses,
    balance,
    categoryBreakdown,
    topCategories,
    recentTransactions,
    totalDebt,
    
    // Actions (from context)
    addTransaction: context.addTransaction,
    updateTransaction: context.updateTransaction,
    deleteTransaction: context.deleteTransaction,
    importTransactions: context.importTransactions,
    addDebt: context.addDebt,
    updateDebt: context.updateDebt,
    deleteDebt: context.deleteDebt,
    addCategory: context.addCategory,
    setLoading: context.setLoading,
    
    // Helpers
    getCategoryName,
    getCategoryColor,
  };
}
