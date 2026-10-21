# Excel Import Performance Fix - Testing Guide

## Overview

This guide provides step-by-step instructions for testing the sequential Excel import pipeline fix. All 12 test cases must pass before deployment.

## Prerequisites

- Development server running (`npm run dev`)
- Supabase database connected
- Test user account created
- Excel files ready for testing (see test data section)

## Test Data Preparation

### Test File 1: Single Expense with Blank ID
Create `test_single_expense.xlsx`:
```
ExpenseID | Date       | Description | Category | Amount | PaymentMethod | Notes
          | 2026-01-29 | Test Item   | food     | 100    | Cash          | Test note
```

### Test File 2: Multiple Expenses
Create `test_multiple_expenses.xlsx`:
```
ExpenseID | Date       | Description | Category | Amount | PaymentMethod | Notes
          | 2026-01-01 | Expense 1   | food     | 100    | Cash          | 
          | 2026-01-02 | Expense 2   | transport| 200    | Card          |
          | 2026-01-03 | Expense 3   | bills    | 300    | Bank          |
... (repeat to 50 rows)
```

### Test File 3: Debts with Returns
Create `test_debts_returns.xlsx`:

**Debts sheet:**
```
DebtID | Person | DebtCategory | Direction | OriginalAmount | Date       | DueDate    | Notes
       | John   | Cash         | Lent      | 1000           | 2026-01-01 | 2026-02-01 | Test debt 1
       | Jane   | Food         | Borrowed  | 500            | 2026-01-02 | 2026-02-02 | Test debt 2
```

**DebtReturns sheet:**
```
ReturnID | DebtID | Date       | Amount | Notes
         | DEBT_1 | 2026-01-15 | 200    | Partial return
         | DEBT_1 | 2026-01-20 | 300    | Partial return
         | DEBT_2 | 2026-01-25 | 500    | Full return
```

### Test File 4: Categories with Expenses
Create `test_categories_expenses.xlsx`:

**Categories sheet:**
```
CategoryID | CategoryName | Type
test_cat1  | Test Cat 1   | Expense
test_cat2  | Test Cat 2   | Expense
```

**Expenses sheet:**
```
ExpenseID | Date       | Description | Category  | Amount | PaymentMethod | Notes
          | 2026-01-01 | Expense 1   | test_cat1 | 100    | Cash          |
          | 2026-01-02 | Expense 2   | test_cat2 | 200    | Card          |
```

### Test File 5: Mixed Record Types
Create `test_mixed.xlsx` with all four sheets:
- Categories (5 records)
- Expenses (20 records)
- Debts (10 records)
- DebtReturns (15 records)

### Test File 6: Invalid Row Among Valid
Create `test_invalid_row.xlsx`:
```
ExpenseID | Date       | Description | Category | Amount | PaymentMethod | Notes
          | 2026-01-01 | Valid 1     | food     | 100    | Cash          | OK
          | INVALID    | Valid 2     | food     | 200    | Card          | OK
          | 2026-01-03 |             | food     | 300    | Cash          | Missing description
          | 2026-01-04 | Valid 4     | food     | 400    | Cash          | OK
```

### Test File 7: Failed Parent Debt
Create `test_failed_debt.xlsx`:

**Debts sheet:**
```
DebtID | Person | DebtCategory | Direction | OriginalAmount | Date       | DueDate | Notes
       | John   | Cash         | Lent      | 1000           | 2026-01-01 |         | Valid debt
DEBT_X | Jane   | INVALID      | Lent      | 500            | 2026-01-02 |         | Invalid category
```

**DebtReturns sheet:**
```
ReturnID | DebtID | Date       | Amount | Notes
         | DEBT_X | 2026-01-15 | 200    | Return for invalid debt
```

### Test File 8: Large Workbook
Create `test_large.xlsx` with 500 mixed records:
- 50 categories
- 200 expenses
- 150 debts
- 100 debt returns

## Test Execution

### Test 1: Single Expense with Blank ID

**Steps:**
1. Navigate to Settings page
2. Scroll to "Excel Import" section
3. Click "Choose File"
4. Select `test_single_expense.xlsx`
5. Review staging summary (should show 1 expense)
6. Select "Merge" mode
7. Click "Start Import"
8. Watch progress bar
9. Verify completion message

**Expected Results:**
- ✅ Import completes successfully
- ✅ Progress bar shows 1/1 records
- ✅ Success count: 1
- ✅ Failed count: 0
- ✅ Expense appears in Expenses page
- ✅ Expense has auto-generated ID (EXPENSE_N)
- ✅ All fields populated correctly

**Verification Queries:**
```sql
-- Check expense was inserted
SELECT * FROM expenses 
WHERE description = 'Test Item' 
AND user_id = 'YOUR_USER_ID';

-- Verify ID was generated
SELECT expense_id FROM expenses 
WHERE description = 'Test Item';
-- Should be: EXPENSE_N (not blank)
```

**Status:** ⏳ PENDING

---

### Test 2: Multiple Expenses

**Steps:**
1. Import `test_multiple_expenses.xlsx` (50 records)
2. Monitor database requests in Network tab
3. Verify sequential processing

**Expected Results:**
- ✅ Import completes in 10-15 seconds
- ✅ Progress bar updates smoothly
- ✅ Only 1 concurrent database request at a time
- ✅ All 50 expenses imported
- ✅ Each expense has unique ID
- ✅ No duplicate IDs

**Verification Queries:**
```sql
-- Count imported expenses
SELECT COUNT(*) FROM expenses 
WHERE description LIKE 'Expense %' 
AND user_id = 'YOUR_USER_ID';
-- Should be: 50

-- Check for duplicate IDs
SELECT expense_id, COUNT(*) 
FROM expenses 
WHERE user_id = 'YOUR_USER_ID'
GROUP BY expense_id 
HAVING COUNT(*) > 1;
-- Should return: 0 rows

-- Verify sequential IDs
SELECT expense_id FROM expenses 
WHERE description LIKE 'Expense %'
ORDER BY created_at;
-- Should be: EXPENSE_N, EXPENSE_N+1, EXPENSE_N+2, ...
```

**Performance Check:**
- Open DevTools → Network tab
- Filter by "rpc" (for ID generation calls)
- Verify only 1 request active at a time
- Total requests should be ~50 (one per expense)

**Status:** ⏳ PENDING

---

### Test 3: Multiple Debts with Linked Returns

**Steps:**
1. Import `test_debts_returns.xlsx`
2. Verify debts imported before returns
3. Check foreign key relationships

**Expected Results:**
- ✅ 2 debts imported successfully
- ✅ 3 debt returns imported successfully
- ✅ All returns reference valid debts
- ✅ No foreign key violations
- ✅ Dependency order respected

**Verification Queries:**
```sql
-- Check debts
SELECT debt_id, person, original_amount 
FROM debts 
WHERE person IN ('John', 'Jane') 
AND user_id = 'YOUR_USER_ID';
-- Should show: 2 rows

-- Check returns
SELECT return_id, debt_id, amount 
FROM debt_returns 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at;
-- Should show: 3 rows

-- Verify foreign keys
SELECT dr.return_id, dr.debt_id, d.debt_id as parent_debt
FROM debt_returns dr
LEFT JOIN debts d ON dr.debt_id = d.debt_id AND dr.user_id = d.user_id
WHERE dr.user_id = 'YOUR_USER_ID';
-- All parent_debt values should be NOT NULL
```

**Status:** ⏳ PENDING

---

### Test 4: Categories with Expenses

**Steps:**
1. Import `test_categories_expenses.xlsx`
2. Verify categories imported first
3. Check expense category references

**Expected Results:**
- ✅ 2 categories imported
- ✅ 2 expenses imported
- ✅ Expenses reference valid categories
- ✅ No orphaned category references

**Verification Queries:**
```sql
-- Check categories
SELECT category_id, category_name 
FROM categories 
WHERE category_id IN ('test_cat1', 'test_cat2')
AND user_id = 'YOUR_USER_ID';
-- Should show: 2 rows

-- Check expenses with categories
SELECT e.expense_id, e.category, c.category_name
FROM expenses e
LEFT JOIN categories c ON e.category = c.category_id AND e.user_id = c.user_id
WHERE e.category IN ('test_cat1', 'test_cat2')
AND e.user_id = 'YOUR_USER_ID';
-- All category_name values should be NOT NULL
```

**Status:** ⏳ PENDING

---

### Test 5: Mixed Record Types

**Steps:**
1. Import `test_mixed.xlsx` (all record types)
2. Verify correct import order
3. Check all relationships

**Expected Results:**
- ✅ 5 categories imported first
- ✅ 20 expenses imported
- ✅ 10 debts imported
- ✅ 15 debt returns imported last
- ✅ All foreign keys valid
- ✅ Total: 50 records imported

**Verification Queries:**
```sql
-- Count all imported records
SELECT 
  (SELECT COUNT(*) FROM categories WHERE user_id = 'YOUR_USER_ID' AND category_id LIKE 'test_%') as categories,
  (SELECT COUNT(*) FROM expenses WHERE user_id = 'YOUR_USER_ID' AND description LIKE 'Mixed%') as expenses,
  (SELECT COUNT(*) FROM debts WHERE user_id = 'YOUR_USER_ID' AND person LIKE 'Mixed%') as debts,
  (SELECT COUNT(*) FROM debt_returns WHERE user_id = 'YOUR_USER_ID') as returns;
-- Should show: 5, 20, 10, 15
```

**Status:** ⏳ PENDING

---

### Test 6: Invalid Row Among Valid

**Steps:**
1. Import `test_invalid_row.xlsx`
2. Verify partial success
3. Check error messages

**Expected Results:**
- ✅ 3 valid expenses imported
- ✅ 1 invalid expense failed
- ✅ Error message shows which record failed
- ✅ Import continues after failure
- ✅ Success count: 3
- ✅ Failed count: 1

**Verification:**
- Check import summary shows 3 successful, 1 failed
- Error list shows details of failed record
- Valid expenses appear in Expenses page
- Failed expense does not appear

**Status:** ⏳ PENDING

---

### Test 7: Failed Parent Debt with Dependent Returns

**Steps:**
1. Import `test_failed_debt.xlsx`
2. Verify debt import fails
3. Check dependent returns are skipped

**Expected Results:**
- ✅ 1 valid debt imported
- ✅ 1 invalid debt failed (invalid category)
- ✅ 1 debt return skipped (parent debt failed)
- ✅ Clear error messages
- ✅ No orphaned returns

**Verification Queries:**
```sql
-- Check only valid debt was imported
SELECT debt_id, person 
FROM debts 
WHERE user_id = 'YOUR_USER_ID' 
AND person = 'John';
-- Should show: 1 row

-- Check no returns for failed debt
SELECT * FROM debt_returns 
WHERE debt_id = 'DEBT_X' 
AND user_id = 'YOUR_USER_ID';
-- Should show: 0 rows
```

**Status:** ⏳ PENDING

---

### Test 8: Double-Click Import Button

**Steps:**
1. Stage a file
2. Rapidly click "Start Import" twice
3. Verify only one import runs

**Expected Results:**
- ✅ First click starts import
- ✅ Second click ignored
- ✅ No duplicate imports
- ✅ No data corruption
- ✅ Import job ID prevents duplicates

**Verification:**
- Check database for duplicate records
- Verify only one set of records imported
- Check console for "Import already in progress" message

**Status:** ⏳ PENDING

---

### Test 9: Page Refresh After Import

**Steps:**
1. Import 100 records
2. Refresh page (F5)
3. Verify all records persist

**Expected Results:**
- ✅ All 100 records still visible
- ✅ No data loss
- ✅ IDs correctly assigned
- ✅ All relationships intact

**Verification Queries:**
```sql
-- Count records after refresh
SELECT COUNT(*) FROM expenses 
WHERE user_id = 'YOUR_USER_ID' 
AND created_at > NOW() - INTERVAL '1 hour';
-- Should match import count
```

**Status:** ⏳ PENDING

---

### Test 10: Retry Failed Row

**Steps:**
1. Import file with 1 failed row
2. Fix error in Excel
3. Re-import same file
4. Verify no duplicates

**Expected Results:**
- ✅ First import: 9 success, 1 failed
- ✅ Second import: 1 success (the fixed row)
- ✅ No duplicate records
- ✅ Merge mode works correctly

**Verification:**
- Count total records before and after
- Verify only 1 new record added
- Check no duplicate IDs

**Status:** ⏳ PENDING

---

### Test 11: Large Workbook (500 records)

**Steps:**
1. Import `test_large.xlsx` (500 records)
2. Monitor performance
3. Verify all records imported

**Expected Results:**
- ✅ Import completes in ~45 seconds
- ✅ No UI freezing
- ✅ Progress updates smooth
- ✅ Memory usage stable
- ✅ All 500 records imported
- ✅ No errors

**Performance Monitoring:**
- Open DevTools → Performance tab
- Record import process
- Check for long tasks (> 50ms)
- Monitor memory usage
- Verify no memory leaks

**Verification Queries:**
```sql
-- Count all imported records
SELECT 
  (SELECT COUNT(*) FROM categories WHERE user_id = 'YOUR_USER_ID') as categories,
  (SELECT COUNT(*) FROM expenses WHERE user_id = 'YOUR_USER_ID') as expenses,
  (SELECT COUNT(*) FROM debts WHERE user_id = 'YOUR_USER_ID') as debts,
  (SELECT COUNT(*) FROM debt_returns WHERE user_id = 'YOUR_USER_ID') as returns;
-- Should match import counts
```

**Status:** ⏳ PENDING

---

### Test 12: Unique IDs and Foreign Keys

**Steps:**
1. Import multiple files
2. Verify all IDs unique
3. Check all foreign keys valid

**Expected Results:**
- ✅ No duplicate IDs across all imports
- ✅ All foreign keys reference valid records
- ✅ No constraint violations
- ✅ Referential integrity maintained

**Verification Queries:**
```sql
-- Check for duplicate expense IDs
SELECT expense_id, COUNT(*) 
FROM expenses 
WHERE user_id = 'YOUR_USER_ID'
GROUP BY expense_id 
HAVING COUNT(*) > 1;
-- Should return: 0 rows

-- Check for duplicate debt IDs
SELECT debt_id, COUNT(*) 
FROM debts 
WHERE user_id = 'YOUR_USER_ID'
GROUP BY debt_id 
HAVING COUNT(*) > 1;
-- Should return: 0 rows

-- Check for orphaned debt returns
SELECT dr.return_id, dr.debt_id
FROM debt_returns dr
LEFT JOIN debts d ON dr.debt_id = d.debt_id AND dr.user_id = d.user_id
WHERE d.debt_id IS NULL;
-- Should return: 0 rows
```

**Status:** ⏳ PENDING

---

## Performance Testing

### Database Request Analysis

**Tool:** Chrome DevTools → Network tab

**Steps:**
1. Open Network tab
2. Filter by "rpc" (for ID generation)
3. Import 100 expenses
4. Analyze requests

**Expected:**
- Sequential requests (not parallel)
- Only 1 request active at a time
- Total requests: ~100 (one per expense)
- No timeouts or errors

**Before Fix:**
- 100+ concurrent requests
- Connection pool exhaustion
- Timeouts and failures

**After Fix:**
- 1 request at a time
- Stable performance
- No timeouts

### Memory Usage

**Tool:** Chrome DevTools → Memory tab

**Steps:**
1. Take heap snapshot before import
2. Import 500 records
3. Take heap snapshot after import
4. Compare snapshots

**Expected:**
- Memory increase < 50 MB
- No memory leaks
- Garbage collection works

### Import Speed

**Benchmark:**
- 10 records: ~2 seconds
- 50 records: ~8 seconds
- 100 records: ~15 seconds
- 500 records: ~45 seconds

**Acceptable Range:** ±20% of benchmark

---

## Error Handling Tests

### Test: Network Failure During Import

**Steps:**
1. Start import
2. Disconnect network mid-import
3. Reconnect network
4. Check state

**Expected Results:**
- ✅ Import stops gracefully
- ✅ Error message shown
- ✅ Already imported records persist
- ✅ Can retry import

### Test: Database Constraint Violation

**Steps:**
1. Create Excel with duplicate ID
2. Import file
3. Check error handling

**Expected Results:**
- ✅ Import detects duplicate
- ✅ Error message clear
- ✅ Other records still imported
- ✅ No data corruption

### Test: Invalid Foreign Key

**Steps:**
1. Create Excel with return referencing non-existent debt
2. Import file
3. Check error handling

**Expected Results:**
- ✅ Import detects invalid reference
- ✅ Return skipped
- ✅ Error message shown
- ✅ Other records imported

---

## User Experience Tests

### Test: Progress Bar Accuracy

**Steps:**
1. Import 100 records
2. Watch progress bar
3. Verify accuracy

**Expected Results:**
- ✅ Progress updates smoothly
- ✅ Percentage accurate
- ✅ Current table shown
- ✅ Record count correct

### Test: Cancellation

**Steps:**
1. Start import
2. Click "Cancel Import"
3. Verify cancellation

**Expected Results:**
- ✅ Import stops after current record
- ✅ Already imported records persist
- ✅ Status shows "Cancelled"
- ✅ Can start new import

### Test: Error Display

**Steps:**
1. Import file with errors
2. Check error display

**Expected Results:**
- ✅ Errors listed clearly
- ✅ Each error shows table, record, message
- ✅ Can scroll through errors
- ✅ Error count accurate

---

## Security Tests

### Test: User Isolation

**Steps:**
1. Import data as User A
2. Log in as User B
3. Try to access User A's data

**Expected Results:**
- ✅ User B cannot see User A's data
- ✅ RLS policies enforced
- ✅ No cross-user access

### Test: Authentication Required

**Steps:**
1. Log out
2. Try to import file

**Expected Results:**
- ✅ Import blocked
- ✅ Redirect to login
- ✅ No unauthorized access

---

## Regression Tests

### Test: Existing Features Still Work

**Steps:**
1. Test expense CRUD operations
2. Test debt CRUD operations
3. Test category management
4. Test reports generation

**Expected Results:**
- ✅ All existing features work
- ✅ No breaking changes
- ✅ Performance not degraded

### Test: Export Still Works

**Steps:**
1. Import data
2. Export to Excel
3. Verify export

**Expected Results:**
- ✅ Export includes all imported data
- ✅ Export format correct
- ✅ No data loss

---

## Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Single Expense with Blank ID | ⏳ PENDING | |
| 2 | Multiple Expenses | ⏳ PENDING | |
| 3 | Multiple Debts with Linked Returns | ⏳ PENDING | |
| 4 | Categories with Expenses | ⏳ PENDING | |
| 5 | Mixed Record Types | ⏳ PENDING | |
| 6 | Invalid Row Among Valid | ⏳ PENDING | |
| 7 | Failed Parent Debt | ⏳ PENDING | |
| 8 | Double-Click Import Button | ⏳ PENDING | |
| 9 | Page Refresh After Import | ⏳ PENDING | |
| 10 | Retry Failed Row | ⏳ PENDING | |
| 11 | Large Workbook (500 records) | ⏳ PENDING | |
| 12 | Unique IDs and Foreign Keys | ⏳ PENDING | |

**Overall Status:** ⏳ PENDING

---

## Deployment Checklist

Before deploying to production:

- [ ] All 12 test cases passed
- [ ] Performance benchmarks met
- [ ] Error handling verified
- [ ] User experience tested
- [ ] Security tests passed
- [ ] Regression tests passed
- [ ] Documentation reviewed
- [ ] Code reviewed
- [ ] Build successful
- [ ] No console errors
- [ ] No memory leaks
- [ ] Database queries optimized

---

## Troubleshooting

### Issue: Import hangs
**Solution:** Check browser console for errors. Verify database connection. Check Network tab for stuck requests.

### Issue: Progress bar not updating
**Solution:** Check if `onProgressUpdate` callback is set. Verify state updates are triggering re-renders.

### Issue: Duplicate IDs
**Solution:** Check ID generation function. Verify sequential processing. Check for race conditions.

### Issue: Foreign key violations
**Solution:** Verify import order (categories → expenses/debts → returns). Check dependency logic.

### Issue: Memory issues
**Solution:** Check for memory leaks in staging area. Verify cleanup on reset. Monitor heap size.

---

## Success Criteria

All tests pass when:
- ✅ 12/12 test cases passed
- ✅ Performance within acceptable range
- ✅ No errors in console
- ✅ No data corruption
- ✅ User experience smooth
- ✅ Security verified
- ✅ No regressions

**Ready for production:** When all criteria met

---

**Testing Started:** ___________
**Testing Completed:** ___________
**Tested By:** ___________
**Status:** ⏳ PENDING
