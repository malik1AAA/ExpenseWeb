# Category Management Feature

## Overview

The Category Management feature allows users to manage expense categories in the Settings page. Users can add, edit, and delete categories, with protection against deleting categories that are currently in use by expenses.

## Features

### 1. Display All Categories
- Shows all expense categories in a clean list format
- Displays usage count for each category (number of expenses using it)
- Visual indicators for categories in use

### 2. Add Category
- Click "Add Category" button to open modal
- Enter category name
- Automatic ID generation from name (lowercase, spaces to hyphens)
- Validation for duplicate names
- Type automatically set to "Expense"

### 3. Edit Category
- Click edit icon on any category
- Modal opens with current name pre-filled
- Can change category name
- Validates for duplicate names (excluding current category)
- Updates all references automatically

### 4. Delete Category
- Click delete icon on any category
- **If category is NOT in use**: Simple confirmation dialog
- **If category IS in use**: Warning dialog showing:
  - List of all expenses using the category
  - Explanation that category cannot be deleted
  - User must reassign or delete expenses first

### 5. Default Categories
The application includes 11 default categories:
1. Food
2. Transport
3. Bills
4. Shopping
5. Health
6. Education
7. Entertainment
8. Family
9. Rent
10. Utilities
11. Other

### 6. Custom Categories
- Users can create unlimited custom categories
- Category names must be unique (case-insensitive)
- Custom categories work exactly like default categories
- All categories are stored in the Categories dataset
- Categories are exported to Excel when exporting data

## Component Structure

### CategoryManager Component
**Location**: `src/components/settings/CategoryManager.jsx`

**Main Features**:
- Displays list of all categories
- Shows usage count for each category
- Handles add/edit/delete operations
- Manages modal states
- Validates category usage before deletion

**Sub-components**:
1. **CategoryForm**: Modal form for adding/editing categories
2. **DeleteConfirmModal**: Simple delete confirmation
3. **DeleteWarningModal**: Warning when trying to delete category in use

## Data Flow

```
Settings Page
    ↓
CategoryManager Component
    ↓
FinanceContext (categories, expenses)
    ↓
Operations:
- addCategory(categoryData)
- updateCategory(id, categoryData)
- deleteCategory(id)
    ↓
Validation:
- Check for duplicate names
- Check if category is in use
- Show appropriate modal
```

## Validation Rules

### Adding a Category
- Name is required
- Name must be unique (case-insensitive)
- Name cannot be empty or whitespace only

### Editing a Category
- Name is required
- Name must be unique (excluding current category)
- Name cannot be empty or whitespace only

### Deleting a Category
- Must not be in use by any expenses
- If in use, shows warning with list of expenses
- User must reassign or delete expenses first

## Usage Protection

### How It Works
1. When user clicks delete on a category
2. System checks if any expenses use that category
3. **If no expenses use it**:
   - Shows simple confirmation dialog
   - User confirms deletion
   - Category is deleted
4. **If expenses use it**:
   - Shows warning dialog
   - Lists all expenses using the category
   - Explains why deletion is not allowed
   - User must click "OK, I Understand"
   - Category is NOT deleted

### Example Warning
```
⚠️ This category is currently in use

The category "Food" is being used by 3 expenses. 
You cannot delete it until all expenses are 
reassigned or deleted.

Expenses using this category:
┌─────────────────────────────────────┐
│ Grocery Store          $85.50       │
│ 2024-01-15                         │
├─────────────────────────────────────┤
│ Restaurant Dinner      $68.00       │
│ 2024-01-10                         │
├─────────────────────────────────────┤
│ Coffee Shop            $12.00       │
│ 2024-01-08                         │
└─────────────────────────────────────┘

[OK, I Understand]
```

## Excel Integration

### Storage
- All categories are stored in the Categories dataset
- Each category has:
  - CategoryID (auto-generated from name)
  - CategoryName (display name)
  - Type (always "Expense")

### Export to Excel
When exporting data to Excel:
1. All categories are included in the Categories sheet
2. Column order: CategoryID, CategoryName, Type
3. Categories are exported in the order they appear in the list
4. Both default and custom categories are exported

### Import from Excel
When importing data from Excel:
1. Categories are read from the Categories sheet
2. Existing categories are replaced with imported data
3. Category IDs must match the schema
4. Validation ensures required columns are present

## UI/UX Features

### Visual Design
- Clean list layout with hover effects
- Icons for edit and delete actions
- Usage count displayed below category name
- Color-coded warning for categories in use
- Responsive design for mobile and desktop

### User Feedback
- Success messages after add/edit/delete
- Error messages for validation failures
- Warning messages for protected deletions
- Clear explanations for all actions

### Accessibility
- Keyboard navigation support
- Proper focus management in modals
- Clear labels and descriptions
- High contrast colors

## Code Examples

### Adding a Category
```javascript
const handleAddCategory = () => {
  setEditingCategory(null);
  setIsFormOpen(true);
};

const handleFormSubmit = (categoryData) => {
  addCategory(categoryData);
  setIsFormOpen(false);
};
```

### Checking Category Usage
```javascript
const getCategoryUsage = (categoryId) => {
  return expenses.filter(
    (expense) => expense[COLUMNS.EXPENSES.CATEGORY] === categoryId
  );
};
```

### Deleting with Protection
```javascript
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
```

## Default Categories

The application includes these default categories:

| Category ID | Category Name | Type |
|-------------|---------------|------|
| food | Food | Expense |
| transport | Transport | Expense |
| bills | Bills | Expense |
| shopping | Shopping | Expense |
| health | Health | Expense |
| education | Education | Expense |
| entertainment | Entertainment | Expense |
| family | Family | Expense |
| rent | Rent | Expense |
| utilities | Utilities | Expense |
| other | Other | Expense |

## Future Enhancements

Potential improvements:
1. **Category Icons**: Add icons to categories for visual distinction
2. **Category Colors**: Allow custom colors for each category
3. **Category Groups**: Group categories (e.g., "Essential", "Discretionary")
4. **Budget per Category**: Set budget limits for each category
5. **Category Archive**: Archive unused categories instead of deleting
6. **Category Merge**: Merge two categories into one
7. **Category Import**: Import categories from CSV/Excel
8. **Category Templates**: Pre-defined category sets for different use cases
9. **Category Search**: Search/filter categories in the list
10. **Category Sort**: Drag-and-drop reordering

## Testing Checklist

- [x] Can add new category
- [x] Can edit existing category
- [x] Can delete unused category
- [x] Cannot delete category in use
- [x] Warning shows list of expenses
- [x] Duplicate names are prevented
- [x] Empty names are prevented
- [x] Categories are exported to Excel
- [x] Categories are imported from Excel
- [x] Usage count displays correctly
- [x] Modals open and close correctly
- [x] Form validation works
- [x] Responsive design works
- [x] No console errors
- [x] Build succeeds

## Summary

The Category Management feature provides a complete solution for managing expense categories with:
- Full CRUD operations
- Protection against deleting categories in use
- Clear warnings and explanations
- Excel integration for import/export
- Clean, intuitive UI
- Comprehensive validation

All requirements have been met:
✅ Display all expense categories
✅ Add category functionality
✅ Edit category functionality
✅ Delete category functionality
✅ Prevent deleting categories in use
✅ Show warning with list of expenses
✅ Default categories included
✅ Custom categories supported
✅ Stored in Categories dataset
✅ Exported to Excel
