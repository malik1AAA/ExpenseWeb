# Excel Validation Layer Implementation

## Overview

A comprehensive validation layer has been added to validate imported Excel data before processing. This ensures data integrity and provides clear feedback to users about any issues in their Excel files.

## Features

### 1. Comprehensive Validation

The validation layer checks for:

- **Missing required columns** - Ensures all necessary columns are present
- **Invalid numbers** - Validates numeric fields contain valid numbers
- **Invalid dates** - Ensures date fields contain valid dates
- **Negative amounts** - Prevents negative values in amount fields
- **Duplicate IDs** - Detects duplicate IDs within each sheet
- **Cross-sheet validation** - Validates DebtReturns reference valid DebtIDs
- **Business logic validation** - Ensures return amounts don't exceed original debt amounts

### 2. Sheet-Specific Validation

#### Expenses Sheet
Required fields:
- ExpenseID (unique)
- Date (valid date)
- Description (non-empty)
- Category (non-empty)
- Amount (positive number, > 0)

#### Debts Sheet
Required fields:
- DebtID (unique)
- Person (non-empty)
- Direction (must be "Lent" or "Borrowed")
- OriginalAmount (positive number, > 0)
- Date (valid date)

#### DebtReturns Sheet
Required fields:
- ReturnID (unique)
- DebtID (must reference existing debt)
- Date (valid date)
- Amount (positive number, > 0)

Additional validation:
- Total returns for a debt cannot exceed original amount

#### Categories Sheet
Required fields:
- CategoryID (unique)
- CategoryName (non-empty)

### 3. User-Friendly Error Display

Validation errors are displayed in a clear, organized format:
- Grouped by sheet
- Shows row numbers
- Indicates which field has the error
- Provides specific error messages
- Expandable/collapsible error list
- Separate display for errors and warnings

## Implementation Details

### Files Created

1. **`src/services/validationService.js`**
   - Core validation logic
   - Validation helper functions
   - Error formatting utilities

2. **`src/components/settings/ValidationErrors.jsx`**
   - UI component for displaying validation errors
   - Expandable/collapsible error list
   - Color-coded error and warning sections

### Files Modified

1. **`src/services/excelService.js`**
   - Integrated validation into `readExcelFile` function
   - Added validation results to import result object

2. **`src/hooks/useExcelImport.js`**
   - Added `validationFormatted` state
   - Processes validation errors from import result
   - Exposes validation data to components

3. **`src/components/settings/ExcelManager.jsx`**
   - Integrated ValidationErrors component
   - Displays validation errors when import fails
   - Allows users to dismiss error display

## Validation Flow

```
1. User selects Excel file
2. User clicks "Import Excel"
3. File is read and parsed
4. Validation runs on parsed data
5. If validation fails:
   - Errors are displayed to user
   - Import is blocked
   - User can see specific issues
6. If validation passes:
   - Data is imported
   - Success message is shown
```

## Error Messages

### Example Validation Errors

```
[Expenses] Row 2: Date - Invalid date format: 2024-13-45
[Expenses] Row 3: Amount - Amount cannot be negative
[Expenses] Row 5: ExpenseID - Duplicate ExpenseID: EXP001
[Debts] Row 2: Direction - Invalid Direction: Loan. Must be one of: Lent, Borrowed
[DebtReturns] Row 3: DebtID - DebtID does not exist: DEBT999
[DebtReturns] Row 4: Amount - Total returns (1500) exceed original debt amount (1000) for DebtID: DEBT001
```

## Validation Functions

### Core Validation Functions

- `validateImportedData(data)` - Main validation entry point
- `validateExpenses(data, result)` - Validates expenses sheet
- `validateDebts(data, result)` - Validates debts sheet
- `validateDebtReturns(data, debts, result)` - Validates debt returns with cross-reference
- `validateCategories(data, result)` - Validates categories sheet

### Helper Functions

- `validateRequiredColumns(data, sheetName, requiredColumns, result)` - Checks for required columns
- `validateDate(value, sheetName, row, fieldName, result)` - Validates date fields
- `validateNumber(value, sheetName, row, fieldName, result, options)` - Validates numeric fields
- `validateRequiredText(value, sheetName, row, fieldName, result)` - Validates text fields
- `validateEnum(value, sheetName, row, fieldName, allowedValues, result)` - Validates enum fields
- `validateUniqueIds(data, sheetName, idField, result)` - Checks for duplicate IDs

### Result Formatting

- `createValidationResult()` - Creates validation result object
- `addError(result, sheet, row, field, message)` - Adds error to result
- `addWarning(result, sheet, row, field, message)` - Adds warning to result
- `formatValidationErrors(validationResult)` - Formats errors for display

## Validation Result Structure

```javascript
{
  isValid: boolean,
  errors: [
    {
      sheet: string,
      row: number,
      field: string,
      message: string
    }
  ],
  warnings: [
    {
      sheet: string,
      row: number,
      field: string,
      message: string
    }
  ],
  stats: {
    totalRows: number,
    validRows: number,
    invalidRows: number
  }
}
```

## User Experience

### Error Display

1. **Summary** - Shows total number of errors and warnings
2. **Errors Section** - Red background, lists all errors
3. **Warnings Section** - Yellow background, lists all warnings
4. **Expandable/Collapsible** - Users can expand/collapse the error list
5. **Dismissable** - Users can close the error display

### Error Organization

Errors are organized by:
- Sheet name (Expenses, Debts, DebtReturns, Categories)
- Row number
- Field name
- Specific error message

## Testing Scenarios

### Test Case 1: Missing Required Columns
**Input:** Excel file with missing "Amount" column in Expenses sheet
**Expected:** Error message indicating missing column

### Test Case 2: Invalid Date
**Input:** Expense with date "2024-13-45"
**Expected:** Error message indicating invalid date format

### Test Case 3: Negative Amount
**Input:** Expense with amount -100
**Expected:** Error message indicating amount cannot be negative

### Test Case 4: Duplicate IDs
**Input:** Two expenses with same ExpenseID
**Expected:** Error message indicating duplicate ID

### Test Case 5: Invalid DebtReference
**Input:** DebtReturn referencing non-existent DebtID
**Expected:** Error message indicating DebtID does not exist

### Test Case 6: Return Exceeds Original
**Input:** Debt with OriginalAmount 1000, Returns totaling 1500
**Expected:** Error message indicating returns exceed original amount

## Benefits

1. **Data Integrity** - Prevents invalid data from entering the system
2. **User Feedback** - Clear, actionable error messages
3. **Early Detection** - Catches issues before data is imported
4. **Cross-Validation** - Validates relationships between sheets
5. **Business Logic** - Enforces business rules (e.g., returns ≤ original)
6. **Non-Crashing** - Application continues to work even with invalid data

## Future Enhancements

Potential improvements:
1. **Auto-fix suggestions** - Suggest fixes for common errors
2. **Partial imports** - Allow importing valid rows and skipping invalid ones
3. **Validation preview** - Show validation results before confirming import
4. **Export validation report** - Allow users to download error report
5. **Custom validation rules** - Allow users to define custom validation rules
6. **Validation templates** - Provide template files with correct structure

## Conclusion

The validation layer provides robust data validation for Excel imports, ensuring data integrity and providing clear feedback to users. The implementation is modular, maintainable, and extensible for future enhancements.
