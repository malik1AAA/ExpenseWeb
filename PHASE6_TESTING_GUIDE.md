# Phase 6: Excel Compatibility Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ Phase 1-5 complete
- ✅ Supabase project configured
- ✅ Database tables created
- ✅ RLS policies applied
- ✅ Authentication working
- ✅ Data services working
- ✅ `.env.local` configured
- ✅ Dev server running

---

## Test Scenario 1: Export Current Data

### Steps:

1. **Sign In and Add Data**
   ```
   Sign in as testuser@example.com
   Add 3-5 expenses
   Add 1-2 debts
   Add 1 debt return
   Add 1 custom category
   ```

2. **Navigate to Settings**
   ```
   Click "Settings" in sidebar
   Scroll to "Excel Data Management"
   ```

3. **Export Current Data**
   ```
   Click "Download Current Excel"
   ```
   - ✅ Excel file should download
   - ✅ File name should be: PersonalFinance_YYYY-MM-DD.xlsx
   - ✅ File should open without errors

4. **Verify Excel Content**
   ```
   Open downloaded Excel file
   ```
   - ✅ Should have 4 sheets: Expenses, Debts, DebtReturns, Categories
   - ✅ Expenses sheet should have user's expenses
   - ✅ Debts sheet should have user's debts
   - ✅ DebtReturns sheet should have user's returns
   - ✅ Categories sheet should have user's categories
   - ✅ Should NOT have other users' data

5. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor
   Check all tables
   ```
   - ✅ All data should have correct user_id
   - ✅ Data should match what's in Excel

---

## Test Scenario 2: Export Backup

### Steps:

1. **Export Backup**
   ```
   Click "Download Backup"
   ```
   - ✅ Excel file should download
   - ✅ File name should be: PersonalFinance_Backup_YYYYMMDD.xlsx
   - ✅ File should be identical to current export

---

## Test Scenario 3: Import to Empty Account

### Steps:

1. **Create New User**
   ```
   Sign out
   Sign up with newuser@example.com
   ```

2. **Verify Empty State**
   ```
   Check Dashboard, Expenses, Debts, Settings
   ```
   - ✅ Should show empty state
   - ✅ Should NOT show any data

3. **Navigate to Settings**
   ```
   Click "Settings" in sidebar
   Scroll to "Excel Data Management"
   ```

4. **Import Excel File**
   ```
   Click "Choose File"
   Select the Excel file exported in Scenario 1
   ```
   - ✅ File name should display
   - ✅ File size should display
   - ✅ Should NOT show "Existing Data Detected" warning (new user)

5. **Validate File**
   ```
   Click "Validate"
   ```
   - ✅ Should show loading state
   - ✅ Should show preview modal
   - ✅ Should show data summary (counts)
   - ✅ Should NOT show foreign key errors

6. **Continue to Import**
   ```
   Click "Continue to Import"
   ```
   - ✅ Should show confirmation dialog
   - ✅ Should show file name and size
   - ✅ Should show warning about data replacement

7. **Confirm Import**
   ```
   Click "Yes, Replace Data"
   ```
   - ✅ Should show loading state
   - ✅ Should show success message
   - ✅ Should show record counts

8. **Verify Data Imported**
   ```
   Navigate to Expenses page
   ```
   - ✅ Should see imported expenses
   - ✅ Should see correct amounts
   - ✅ Should see correct categories

9. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor
   ```
   - ✅ All tables should have data
   - ✅ All data should have newuser's user_id
   - ✅ Data should match Excel file

---

## Test Scenario 4: Import with Replace Mode

### Steps:

1. **Sign In as Original User**
   ```
   Sign out
   Sign in as testuser@example.com
   ```

2. **Verify Existing Data**
   ```
   Check Expenses page
   ```
   - ✅ Should see existing expenses

3. **Navigate to Settings**
   ```
   Click "Settings" → "Excel Data Management"
   ```

4. **Import Excel File**
   ```
   Click "Choose File"
   Select Excel file
   ```
   - ✅ Should show "Existing Data Detected" warning
   - ✅ Should show radio buttons for import mode

5. **Select Replace Mode**
   ```
   Select "Replace all data" radio button
   ```
   - ✅ Radio button should be selected

6. **Validate and Import**
   ```
   Click "Validate"
   Click "Continue to Import"
   ```
   - ✅ Preview should show "Warning: Data Replacement"
   - ✅ Confirmation should show red warning
   - ✅ Should say "replace all existing data"

7. **Confirm Import**
   ```
   Click "Yes, Replace Data"
   ```
   - ✅ Should import successfully
   - ✅ Old data should be replaced
   - ✅ New data should be present

8. **Verify Old Data Deleted**
   ```
   Check Expenses page
   ```
   - ✅ Should see only imported data
   - ✅ Should NOT see old data that wasn't in Excel

---

## Test Scenario 5: Import with Merge Mode

### Steps:

1. **Add More Data**
   ```
   Add 2-3 new expenses manually
   Note the expense IDs
   ```

2. **Navigate to Settings**
   ```
   Click "Settings" → "Excel Data Management"
   ```

3. **Import Excel File**
   ```
   Click "Choose File"
   Select Excel file
   ```
   - ✅ Should show "Existing Data Detected" warning

4. **Select Merge Mode**
   ```
   Select "Merge with existing data" radio button
   ```
   - ✅ Radio button should be selected

5. **Validate and Import**
   ```
   Click "Validate"
   Click "Continue to Import"
   ```
   - ✅ Preview should show "Info: Data Merge"
   - ✅ Confirmation should show blue info
   - ✅ Should say "merge new data"

6. **Confirm Import**
   ```
   Click "Yes, Merge Data"
   ```
   - ✅ Should import successfully

7. **Verify Data Merged**
   ```
   Check Expenses page
   ```
   - ✅ Should see BOTH old and new data
   - ✅ Should see manually added expenses
   - ✅ Should see imported expenses
   - ✅ Duplicate IDs should be skipped

8. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → expenses
   ```
   - ✅ Should have all records
   - ✅ No duplicate IDs
   - ✅ All have correct user_id

---

## Test Scenario 6: Foreign Key Validation

### Steps:

1. **Create Invalid Excel File**
   ```
   Create Excel file with:
   - Debts sheet: 1 debt with ID "DEBT_999"
   - DebtReturns sheet: 1 return referencing "DEBT_999"
   ```

2. **Try to Import**
   ```
   Navigate to Settings → Excel Data Management
   Choose the invalid Excel file
   Click "Validate"
   ```
   - ✅ Should show validation error
   - ✅ Should say "DebtID DEBT_999 does not exist in debts"
   - ✅ Should NOT allow import

3. **Fix Excel File**
   ```
   Edit Excel file:
   - Add debt with ID "DEBT_999" to Debts sheet
   ```

4. **Try to Import Again**
   ```
   Choose the fixed Excel file
   Click "Validate"
   ```
   - ✅ Should pass validation
   - ✅ Should show preview
   - ✅ Should allow import

---

## Test Scenario 7: Duplicate ID Handling

### Steps:

1. **Create Excel with Duplicates**
   ```
   Create Excel file with:
   - Expenses sheet: 2 expenses with same ID "EXP_999"
   ```

2. **Try to Import**
   ```
   Navigate to Settings → Excel Data Management
   Choose the Excel file
   Click "Validate"
   ```
   - ✅ Should show warning about duplicates
   - ✅ Should say "Found 1 duplicate expense(s) that were skipped"
   - ✅ Should still allow import

3. **Import in Merge Mode**
   ```
   Select "Merge with existing data"
   Click "Continue to Import"
   Click "Yes, Merge Data"
   ```
   - ✅ Should import successfully
   - ✅ Should skip duplicate IDs
   - ✅ Should add non-duplicate records

4. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → expenses
   ```
   - ✅ Should have only one record with ID "EXP_999"
   - ✅ Should NOT have duplicate records

---

## Test Scenario 8: User Data Isolation

### Steps:

1. **Export Data as User A**
   ```
   Sign in as userA@example.com
   Add some expenses
   Export to Excel
   ```

2. **Export Data as User B**
   ```
   Sign out
   Sign in as userB@example.com
   Add different expenses
   Export to Excel
   ```

3. **Compare Excel Files**
   ```
   Open both Excel files
   ```
   - ✅ User A's file should have only User A's data
   - ✅ User B's file should have only User B's data
   - ✅ Files should be different

4. **Try to Import User A's Data as User B**
   ```
   Sign in as userB@example.com
   Import User A's Excel file
   ```
   - ✅ Should import successfully
   - ✅ Data should be saved with User B's user_id
   - ✅ User A should NOT see this data

5. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor
   ```
   - ✅ User A's data should have User A's user_id
   - ✅ User B's data should have User B's user_id
   - ✅ No cross-user data

---

## Test Scenario 9: Large File Import

### Steps:

1. **Create Large Excel File**
   ```
   Create Excel file with:
   - 1000 expenses
   - 100 debts
   - 200 debt returns
   - 50 categories
   ```

2. **Import Large File**
   ```
   Navigate to Settings → Excel Data Management
   Choose the large Excel file
   Click "Validate"
   ```
   - ✅ Should validate successfully
   - ✅ Should show preview with correct counts
   - ✅ Should complete in reasonable time (< 10 seconds)

3. **Import File**
   ```
   Click "Continue to Import"
   Click "Yes, Replace Data"
   ```
   - ✅ Should import successfully
   - ✅ Should complete in reasonable time (< 30 seconds)
   - ✅ Should show success message with counts

4. **Verify Performance**
   ```
   Navigate to Expenses page
   Scroll through list
   Apply filters
   ```
   - ✅ Should load quickly
   - ✅ Scrolling should be smooth
   - ✅ Filters should work quickly

---

## Test Scenario 10: Error Handling

### Steps:

1. **Try to Import Invalid File**
   ```
   Choose a non-Excel file (e.g., .txt)
   Click "Validate"
   ```
   - ✅ Should show error message
   - ✅ Should not crash
   - ✅ Should allow trying again

2. **Try to Import Corrupted File**
   ```
   Create corrupted Excel file
   Try to import
   ```
   - ✅ Should show error message
   - ✅ Should not crash
   - ✅ Should allow trying again

3. **Try to Import with Missing Columns**
   ```
   Create Excel file missing required columns
   Try to import
   ```
   - ✅ Should show validation error
   - ✅ Should list missing columns
   - ✅ Should not allow import

4. **Test Network Error**
   ```
   Turn off internet connection
   Try to import
   ```
   - ✅ Should show network error
   - ✅ Should not crash
   - ✅ Should allow retry after reconnecting

---

## Verification Checklist

### Export Functionality
- [ ] Export creates valid Excel file
- [ ] Export includes only current user's data
- [ ] Export file has correct structure (4 sheets)
- [ ] Export file name is auto-generated
- [ ] Backup export has correct suffix
- [ ] Export works with empty data
- [ ] Export works with large datasets

### Import Functionality
- [ ] Import validates file structure
- [ ] Import validates data types
- [ ] Import validates foreign keys
- [ ] Import detects duplicates
- [ ] Import shows preview
- [ ] Import shows confirmation
- [ ] Import saves to Supabase
- [ ] Import updates local state

### Import Modes
- [ ] Replace mode deletes existing data
- [ ] Replace mode imports new data
- [ ] Merge mode preserves existing data
- [ ] Merge mode adds new data
- [ ] Merge mode skips duplicates
- [ ] Mode selection UI works
- [ ] Confirmation dialog shows correct mode

### User Isolation
- [ ] User A cannot see User B's data
- [ ] User A's import doesn't affect User B
- [ ] Each user has separate data
- [ ] RLS policies prevent cross-user access
- [ ] Export only includes user's data

### Error Handling
- [ ] Invalid file shows error
- [ ] Missing columns show error
- [ ] Invalid data types show error
- [ ] Foreign key violations show error
- [ ] Network errors handled gracefully
- [ ] Supabase errors handled gracefully
- [ ] No crashes on errors

### Performance
- [ ] Large files import successfully
- [ ] Import completes in reasonable time
- [ ] UI remains responsive during import
- [ ] No memory leaks
- [ ] Smooth scrolling with large datasets

---

## Common Issues and Solutions

### Issue: Import fails with "Foreign key violation"
**Solution:** Ensure all debt returns reference valid debt IDs

### Issue: Merge mode doesn't skip duplicates
**Solution:** Check that IDs match exactly (case-sensitive)

### Issue: Export includes other user's data
**Solution:** Verify RLS policies are applied correctly

### Issue: Import is very slow
**Solution:** Check file size, consider splitting large files

### Issue: Data not saving to Supabase
**Solution:** Check authentication, verify user is signed in

---

## Success Criteria

Phase 6 is complete when:
- ✅ All test scenarios pass
- ✅ All checklist items verified
- ✅ No critical bugs remain
- ✅ Import/export works reliably
- ✅ User isolation enforced
- ✅ Error handling robust
- ✅ Performance acceptable

---

## Next Steps

After completing all tests:
1. Mark all checklist items as complete
2. Document any issues found
3. Proceed to Phase 7 (Migration & Compatibility)

If tests fail:
1. Review the failing test scenario
2. Check troubleshooting section
3. Review code implementation
4. Fix issues and retest

---

**Status:** Ready for testing
**Estimated Time:** 2-3 hours for complete testing
