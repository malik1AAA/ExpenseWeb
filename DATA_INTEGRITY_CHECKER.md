# Data Integrity Checker

## Overview

The Data Integrity Checker is a comprehensive validation tool that ensures your financial data is consistent, accurate, and free from common data quality issues. It performs 10 different checks on your expenses, debts, and debt returns without modifying any data.

## Features

### 10 Integrity Checks

1. **Duplicate ExpenseIDs** - Detects expenses with duplicate or missing IDs
2. **Duplicate DebtIDs** - Detects debts with duplicate or missing IDs
3. **Duplicate ReturnIDs** - Detects debt returns with duplicate or missing IDs
4. **Missing Categories** - Finds expenses referencing non-existent categories
5. **Orphaned Debt Returns** - Identifies returns referencing non-existent debts
6. **Negative Amounts** - Detects negative values in expenses, debts, or returns
7. **Invalid Dates** - Finds missing or unparseable dates
8. **Returns Exceeding Debt** - Identifies debts where total returns exceed original amount
9. **Invalid Direction Values** - Detects debts with invalid direction values (not "Lent" or "Borrowed")
10. **Missing Required Fields** - Finds records with missing mandatory fields

### Result Categories

- **Passed** ✅ - Check completed successfully, no issues found
- **Warnings** ⚠️ - Potential issues that should be reviewed (e.g., missing categories)
- **Errors** ❌ - Critical issues that must be fixed (e.g., duplicate IDs, orphaned returns)

## Usage

### Accessing the Checker

1. Navigate to **Settings** page
2. Scroll to the **Data Integrity Checker** section
3. Click the **"Run Checks"** button

### Understanding Results

#### Summary Section
At the top, you'll see three counters:
- **Passed** (green) - Number of checks that passed
- **Warnings** (amber) - Number of checks with warnings
- **Errors** (red) - Number of checks with errors

#### Detailed Results
Each check is displayed as an expandable card:
- Click on a check to expand/collapse details
- Color-coded border indicates status (green/amber/red)
- Shows issue count for quick reference
- Expandable details show specific problematic records

### Overall Status Message
At the bottom, you'll see an overall status:
- **All Checks Passed** - Your data is clean
- **Data Quality Warnings** - Review recommended
- **Data Integrity Issues Found** - Fix errors before proceeding

## Check Details

### 1. Duplicate ExpenseIDs
**Status:** Error if found

**What it checks:**
- Each expense must have a unique ExpenseID
- No two expenses can share the same ID
- All expenses must have an ExpenseID

**Example issue:**
```
ID: EXP001 - Grocery Shopping (2024-01-15)
ID: EXP001 - Gas Station (2024-01-16)
```

**How to fix:**
- Edit one of the duplicate expenses and assign a unique ID
- Or delete the duplicate entry

---

### 2. Duplicate DebtIDs
**Status:** Error if found

**What it checks:**
- Each debt must have a unique DebtID
- No two debts can share the same ID
- All debts must have a DebtID

**Example issue:**
```
ID: DEBT001 - John Smith (2024-01-10)
ID: DEBT001 - Jane Doe (2024-01-12)
```

**How to fix:**
- Edit one of the duplicate debts and assign a unique ID
- Or delete the duplicate entry

---

### 3. Duplicate ReturnIDs
**Status:** Error if found

**What it checks:**
- Each debt return must have a unique ReturnID
- No two returns can share the same ID
- All returns must have a ReturnID

**Example issue:**
```
ID: RET001 - Debt: DEBT001 (2024-01-20)
ID: RET001 - Debt: DEBT002 (2024-01-22)
```

**How to fix:**
- Edit one of the duplicate returns and assign a unique ID
- Or delete the duplicate entry

---

### 4. Missing Categories
**Status:** Warning if found

**What it checks:**
- Each expense must reference a valid category ID
- The category must exist in the categories list

**Example issue:**
```
Category: invalid_category - Grocery Shopping (2024-01-15)
Category: MISSING - Gas Station (2024-01-16)
```

**How to fix:**
- Edit the expense and select a valid category from the dropdown
- Or add the missing category in Category Management

**Why it's a warning:**
- The expense still exists and can be used
- But reports and charts may not display correctly
- Category-based filtering won't work properly

---

### 5. Orphaned Debt Returns
**Status:** Error if found

**What it checks:**
- Each debt return must reference an existing debt
- The DebtID in the return must match an actual debt

**Example issue:**
```
Return ID: RET001 - References missing debt: DEBT999 (2024-01-20)
```

**How to fix:**
- Edit the return and select a valid debt
- Or delete the orphaned return
- Or recreate the missing debt with the correct ID

**Why it's an error:**
- The return has no effect (no debt to reduce)
- Data is inconsistent
- Can cause confusion in debt tracking

---

### 6. Negative Amounts
**Status:** Error if found

**What it checks:**
- Expense amounts must be ≥ 0
- Debt original amounts must be ≥ 0
- Debt return amounts must be ≥ 0

**Example issue:**
```
Expense: Grocery Shopping - -50.00
Debt: John Smith - -100.00
Debt Return: Return for DEBT001 - -25.00
```

**How to fix:**
- Edit the record and enter a positive amount
- If you need to reverse a transaction, create a new record with the opposite type

**Why it's an error:**
- Negative amounts don't make sense in this context
- Can cause calculation errors
- Breaks financial reporting

---

### 7. Invalid Dates
**Status:** Error if found

**What it checks:**
- All dates must be present (not empty)
- All dates must be valid ISO format (YYYY-MM-DD)
- Dates must be parseable

**Example issue:**
```
Expense Date: Grocery Shopping - INVALID_DATE
Debt Date: John Smith - MISSING
Return Date: Return for DEBT001 - 2024-13-45
```

**How to fix:**
- Edit the record and enter a valid date in YYYY-MM-DD format
- Ensure the date is real (e.g., not February 30th)

**Why it's an error:**
- Dates are required for sorting and filtering
- Invalid dates break date-based calculations
- Reports won't work correctly

---

### 8. Returns Exceeding Debt
**Status:** Error if found

**What it checks:**
- Total returns for a debt cannot exceed the original debt amount
- Prevents overpayment scenarios

**Example issue:**
```
John Smith - Original: 100.00, Returned: 150.00, Excess: 50.00
```

**How to fix:**
- Review the debt and its returns
- Delete or edit excess returns
- Verify the original debt amount is correct

**Why it's an error:**
- Mathematically impossible in real life
- Indicates data entry error
- Breaks debt tracking logic

---

### 9. Invalid Direction Values
**Status:** Error if found

**What it checks:**
- Debt direction must be either "Lent" or "Borrowed"
- No other values are allowed
- Direction cannot be empty

**Example issue:**
```
John Smith - Invalid: "loan" (Valid: Lent, Borrowed)
Jane Doe - Invalid: "MISSING" (Valid: Lent, Borrowed)
```

**How to fix:**
- Edit the debt and select either "Lent" or "Borrowed"
- Ensure the direction accurately reflects the debt type

**Why it's an error:**
- Direction is critical for debt classification
- Affects how debts are displayed and calculated
- Breaks debt statistics and reports

---

### 10. Missing Required Fields
**Status:** Error if found

**What it checks:**

**Expenses must have:**
- ExpenseID
- Date
- Description
- Category
- Amount

**Debts must have:**
- DebtID
- Person
- Direction
- OriginalAmount
- Date

**Debt Returns must have:**
- ReturnID
- DebtID
- Date
- Amount

**Example issue:**
```
Expense - Missing: Date, Amount
Debt - Missing: Person, Direction
Debt Return - Missing: Amount
```

**How to fix:**
- Edit the record and fill in all missing fields
- Ensure all required information is present

**Why it's an error:**
- Records are incomplete and unusable
- Breaks data integrity
- Can cause application errors

## Best Practices

### Before Importing Data

1. **Run integrity checks** on your Excel file before importing
2. **Fix all errors** - they will prevent proper data import
3. **Review warnings** - they may cause issues in reports
4. **Backup your data** before making changes

### Regular Maintenance

1. **Run checks monthly** to catch issues early
2. **Fix errors immediately** to prevent data corruption
3. **Review warnings** periodically
4. **Validate after bulk operations** (import, export, etc.)

### Common Issues and Solutions

#### Issue: Duplicate IDs after Excel import
**Solution:**
- Check your Excel file for duplicate IDs before import
- Use the integrity checker to identify duplicates
- Edit duplicates in the application or fix in Excel

#### Issue: Orphaned returns
**Solution:**
- Ensure debts are created before returns
- Check that return DebtIDs match actual debt IDs
- Delete orphaned returns if the debt no longer exists

#### Issue: Missing categories
**Solution:**
- Add missing categories in Category Management
- Or edit expenses to use existing categories
- Run checks again to verify

#### Issue: Invalid dates
**Solution:**
- Ensure dates are in YYYY-MM-DD format
- Check for typos (e.g., "2024-13-45")
- Use date picker when possible

## Technical Details

### Implementation

**Service:** `src/services/integrityCheckerService.js`
- Pure functions for each check
- No side effects
- Returns structured results

**Component:** `src/components/settings/DataIntegrityChecker.jsx`
- React component with expandable results
- Color-coded status indicators
- Detailed issue display

### Performance

- **Fast execution** - Checks run in milliseconds
- **Efficient algorithms** - Uses Maps for O(1) lookups
- **No data modification** - Read-only operations
- **Memory efficient** - Processes data in place

### Data Flow

```
User clicks "Run Checks"
    ↓
runIntegrityChecks() called
    ↓
10 check functions executed
    ↓
Results aggregated
    ↓
UI displays results
    ↓
User reviews and fixes issues
```

## API Reference

### runIntegrityChecks(expenses, debts, debtReturns, categories)

**Parameters:**
- `expenses` - Array of expense objects
- `debts` - Array of debt objects
- `debtReturns` - Array of debt return objects
- `categories` - Array of category objects

**Returns:**
```javascript
{
  checks: [
    {
      name: 'Check Name',
      status: 'passed' | 'warning' | 'error',
      message: 'Description',
      count: 0,
      details: [...]
    }
  ],
  summary: {
    total: 10,
    passed: 8,
    warnings: 1,
    errors: 1
  }
}
```

### Individual Check Functions

Each check can be run independently:

```javascript
import { 
  checkDuplicateExpenseIDs,
  checkDuplicateDebtIDs,
  // ... etc
} from './services/integrityCheckerService';

const result = checkDuplicateExpenseIDs(expenses);
```

## Troubleshooting

### Checks not running
- Ensure you have data in the application
- Check browser console for errors
- Refresh the page and try again

### False positives
- Review the specific records flagged
- Check if the data is actually correct
- Report issues if checks are incorrect

### Performance issues
- Checks should complete in < 1 second
- If slow, check dataset size
- Consider splitting large datasets

## Future Enhancements

Potential improvements:
1. **Auto-fix suggestions** - Suggest fixes for common issues
2. **Export report** - Download check results as PDF/Excel
3. **Scheduled checks** - Run checks automatically
4. **Custom checks** - Allow users to define custom rules
5. **Check history** - Track check results over time
6. **Batch fix** - Fix multiple issues at once
7. **Data backup** - Auto-backup before fixes
8. **Integration with import** - Run checks before import

## Summary

The Data Integrity Checker is an essential tool for maintaining data quality in your finance application. It helps you:

- ✅ Catch data entry errors early
- ✅ Ensure data consistency
- ✅ Prevent calculation errors
- ✅ Maintain report accuracy
- ✅ Improve data quality

**Key Benefits:**
- No automatic modifications - you control all changes
- Comprehensive coverage - 10 different checks
- Clear reporting - easy to understand results
- Fast execution - checks run in milliseconds
- Regular use recommended - run before imports and periodically

**Remember:** Always review and fix errors before they affect your financial data and reports!
