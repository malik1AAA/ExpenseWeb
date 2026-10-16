import { useState, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { COLUMNS } from '../../config/excelSchema';
import { Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { Modal, Input, Button } from '../common';

/**
 * CategoryManager Component
 * Manages expense categories with CRUD operations
 */
export default function CategoryManager() {
  const {
    categories,
    expenses,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useFinance();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null);

  // Check if category is used by any expenses
  const getCategoryUsage = (categoryId) => {
    return expenses.filter(
      (expense) => expense[COLUMNS.EXPENSES.CATEGORY] === categoryId
    );
  };

  // Handle add category
  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = (categoryData) => {
    if (editingCategory) {
      // Update existing category
      updateCategory(
        editingCategory[COLUMNS.CATEGORIES.CATEGORY_ID],
        categoryData
      );
    } else {
      // Add new category
      addCategory(categoryData);
    }
    setIsFormOpen(false);
  };

  // Handle delete request
  const handleDeleteRequest = (category) => {
    const usedExpenses = getCategoryUsage(category[COLUMNS.CATEGORIES.CATEGORY_ID]);
    
    if (usedExpenses.length > 0) {
      // Show warning with list of expenses
      setDeleteWarning({
        category,
        expenses: usedExpenses,
      });
      setIsDeleteConfirmOpen(true);
    } else {
      // No expenses using this category, can delete directly
      setCategoryToDelete(category);
      setIsDeleteConfirmOpen(true);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete[COLUMNS.CATEGORIES.CATEGORY_ID]);
    }
    setCategoryToDelete(null);
    setDeleteWarning(null);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-surface-900">
            Expense Categories
          </h3>
          <p className="text-sm text-surface-600 mt-1">
            Manage your expense categories
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleAddCategory}>
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {categories.map((category) => {
          const usageCount = getCategoryUsage(category[COLUMNS.CATEGORIES.CATEGORY_ID]).length;
          
          return (
            <div
              key={category[COLUMNS.CATEGORIES.CATEGORY_ID]}
              className="flex items-center justify-between p-4 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-surface-900">
                  {category[COLUMNS.CATEGORIES.CATEGORY_NAME]}
                </p>
                {usageCount > 0 && (
                  <p className="text-xs text-surface-500 mt-1">
                    Used by {usageCount} {usageCount === 1 ? 'expense' : 'expenses'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="p-2 rounded-lg hover:bg-surface-200 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-surface-600" />
                </button>
                <button
                  onClick={() => handleDeleteRequest(category)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Category Modal */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      {deleteWarning ? (
        <DeleteWarningModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setDeleteWarning(null);
          }}
          category={deleteWarning.category}
          expenses={deleteWarning.expenses}
        />
      ) : (
        <DeleteConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setCategoryToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          category={categoryToDelete}
        />
      )}
    </div>
  );
}

/**
 * CategoryForm - Modal form for adding/editing categories
 */
function CategoryForm({ isOpen, onClose, onSubmit, category, categories }) {
  const [formData, setFormData] = useState({
    [COLUMNS.CATEGORIES.CATEGORY_NAME]: '',
  });
  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (category) {
      setFormData({
        [COLUMNS.CATEGORIES.CATEGORY_NAME]: category[COLUMNS.CATEGORIES.CATEGORY_NAME] || '',
      });
    } else {
      setFormData({
        [COLUMNS.CATEGORIES.CATEGORY_NAME]: '',
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData[COLUMNS.CATEGORIES.CATEGORY_NAME].trim()) {
      newErrors[COLUMNS.CATEGORIES.CATEGORY_NAME] = 'Category name is required';
    } else {
      // Check for duplicate names (excluding current category if editing)
      const duplicate = categories.find(
        (cat) =>
          cat[COLUMNS.CATEGORIES.CATEGORY_NAME].toLowerCase() ===
            formData[COLUMNS.CATEGORIES.CATEGORY_NAME].toLowerCase() &&
          (!category || cat[COLUMNS.CATEGORIES.CATEGORY_ID] !== category[COLUMNS.CATEGORIES.CATEGORY_ID])
      );
      if (duplicate) {
        newErrors[COLUMNS.CATEGORIES.CATEGORY_NAME] = 'Category name already exists';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const categoryData = {
      [COLUMNS.CATEGORIES.CATEGORY_NAME]: formData[COLUMNS.CATEGORIES.CATEGORY_NAME].trim(),
      [COLUMNS.CATEGORIES.TYPE]: 'Expense',
    };

    onSubmit(categoryData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add Category'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name"
          value={formData[COLUMNS.CATEGORIES.CATEGORY_NAME]}
          onChange={(e) => handleChange(COLUMNS.CATEGORIES.CATEGORY_NAME, e.target.value)}
          error={errors[COLUMNS.CATEGORIES.CATEGORY_NAME]}
          placeholder="e.g., Groceries"
          required
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            {category ? 'Update' : 'Add'} Category
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * DeleteConfirmModal - Simple delete confirmation
 */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, category }) {
  if (!category) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Category" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-surface-700">
          Are you sure you want to delete the category "{category[COLUMNS.CATEGORIES.CATEGORY_NAME]}"?
        </p>
        <p className="text-sm text-surface-500">
          This action cannot be undone.
        </p>

        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * DeleteWarningModal - Warning modal when trying to delete a category in use
 */
function DeleteWarningModal({ isOpen, onClose, category, expenses }) {
  if (!category) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cannot Delete Category" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              This category is currently in use
            </p>
            <p className="text-sm text-amber-700 mt-1">
              The category "{category[COLUMNS.CATEGORIES.CATEGORY_NAME]}" is being used by {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}. You cannot delete it until all expenses are reassigned or deleted.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-surface-700 mb-2">
            Expenses using this category:
          </p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense[COLUMNS.EXPENSES.EXPENSE_ID]}
                className="flex items-center justify-between p-3 bg-surface-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900">
                    {expense[COLUMNS.EXPENSES.DESCRIPTION]}
                  </p>
                  <p className="text-xs text-surface-500">
                    {expense[COLUMNS.EXPENSES.DATE]}
                  </p>
                </div>
                <p className="text-sm font-semibold text-surface-900">
                  ${expense[COLUMNS.EXPENSES.AMOUNT].toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="primary" onClick={onClose} className="flex-1">
            OK, I Understand
          </Button>
        </div>
      </div>
    </Modal>
  );
}
