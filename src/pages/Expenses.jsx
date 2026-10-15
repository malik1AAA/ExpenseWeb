import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { PageHeader, Button, DeleteConfirmation } from '../components/common';
import { ExpenseFilters, ExpenseTable, ExpenseForm, ExpenseSummary } from '../components/expenses';
import { filterExpenses } from '../services/expenseFilterService';
import { COLUMNS } from '../config/excelSchema';

export default function Expenses() {
  const {
    expenses,
    categories,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useFinance();

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    month: '',
    year: '',
    category: '',
    paymentMethod: '',
  });

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Apply filters
  const filteredExpenses = filterExpenses(expenses, filters);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Handle add expense
  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  // Handle edit expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = (expenseData) => {
    if (editingExpense) {
      // Update existing expense
      updateExpense(editingExpense[COLUMNS.EXPENSES.EXPENSE_ID], expenseData);
    } else {
      // Add new expense
      addExpense(expenseData);
    }
  };

  // Handle delete request
  const handleDeleteRequest = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteConfirmOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete[COLUMNS.EXPENSES.EXPENSE_ID]);
      setExpenseToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Expenses"
        description="Track and manage your expenses"
      >
        <Button variant="primary" icon={Plus} onClick={handleAddExpense}>
          Add Expense
        </Button>
      </PageHeader>

      {/* Summary */}
      <ExpenseSummary expenses={filteredExpenses} />

      {/* Filters */}
      <ExpenseFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        expenses={expenses}
      />

      {/* Table */}
      <ExpenseTable
        expenses={filteredExpenses}
        categories={categories}
        onEdit={handleEditExpense}
        onDelete={handleDeleteRequest}
      />

      {/* Add/Edit Form Modal */}
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        expense={editingExpense}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expenseToDelete?.[COLUMNS.EXPENSES.DESCRIPTION]}"? This action cannot be undone.`}
      />
    </div>
  );
}
