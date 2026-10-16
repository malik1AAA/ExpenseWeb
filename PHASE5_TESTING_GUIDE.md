# Phase 5: Data Services Testing Guide

## Prerequisites

Before testing, ensure:
- ✅ Phase 1-4 complete
- ✅ Supabase project configured
- ✅ Database tables created (Phase 2)
- ✅ RLS policies applied (Phase 3)
- ✅ Authentication working (Phase 4)
- ✅ `.env.local` configured with Supabase credentials
- ✅ Dev server running (`npm run dev`)

---

## Test Scenario 1: Data Loading After Login

### Steps:

1. **Create Test User**
   ```
   Navigate to: http://localhost:5173/signup
   Sign up with: testuser@example.com / password123
   ```

2. **Verify Initial State**
   ```
   After login, check Dashboard
   ```
   - ✅ Should show empty state (no expenses, debts, etc.)
   - ✅ Should NOT show sample data
   - ✅ Should show "No expenses yet" or similar empty state

3. **Check Browser Console**
   ```
   Open DevTools (F12) → Console tab
   ```
   - ✅ Should see successful fetch operations
   - ✅ Should NOT see errors
   - ✅ Should see data loaded from Supabase

4. **Verify Database**
   ```
   Go to Supabase Dashboard → Table Editor
   Check expenses, debts, debt_returns, categories tables
   ```
   - ✅ Tables should be empty for this user
   - ✅ user_id should match authenticated user's ID

---

## Test Scenario 2: Create Expense

### Steps:

1. **Navigate to Expenses Page**
   ```
   Click "Expenses" in sidebar
   ```
   - ✅ Should show empty expenses list

2. **Add New Expense**
   ```
   Click "Add Expense" button
   Fill form:
   - Date: 2024-01-15
   - Description: Test Expense
   - Category: Food
   - Amount: 50.00
   - Payment Method: Cash
   Click "Add Expense"
   ```
   - ✅ Expense should appear in list immediately
   - ✅ Should show correct amount (Rs. 50)
   - ✅ Should show correct category

3. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → expenses
   ```
   - ✅ Should see new row
   - ✅ user_id should match test user
   - ✅ expense_id should be auto-generated (EXP_1)
   - ✅ All fields should match form input
   - ✅ created_at should be current timestamp

4. **Refresh Page**
   ```
   Press F5 or Ctrl+R
   ```
   - ✅ Expense should still be there
   - ✅ Data persists across page refresh

---

## Test Scenario 3: Update Expense

### Steps:

1. **Edit Existing Expense**
   ```
   Click edit icon on the expense created in Scenario 2
   Change:
   - Description: Updated Test Expense
   - Amount: 75.00
   Click "Update Expense"
   ```
   - ✅ Expense should update immediately in UI
   - ✅ Should show new amount (Rs. 75)
   - ✅ Should show new description

2. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → expenses
   ```
   - ✅ Row should be updated
   - ✅ description should be "Updated Test Expense"
   - ✅ amount should be 75.00
   - ✅ updated_at should be newer than created_at

3. **Refresh Page**
   ```
   Press F5
   ```
   - ✅ Updated data should persist

---

## Test Scenario 4: Delete Expense

### Steps:

1. **Delete Expense**
   ```
   Click delete icon on the expense
   Confirm deletion
   ```
   - ✅ Expense should disappear from UI immediately

2. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → expenses
   ```
   - ✅ Row should be deleted
   - ✅ Should not see the expense

3. **Refresh Page**
   ```
   Press F5
   ```
   - ✅ Expense should still be gone
   - ✅ Deletion persists

---

## Test Scenario 5: Create Debt

### Steps:

1. **Navigate to Debts Page**
   ```
   Click "Debts" in sidebar
   ```

2. **Add New Debt**
   ```
   Click "Add Debt" button
   Fill form:
   - Person: John Doe
   - Direction: Lent
   - Original Amount: 1000
   - Date: 2024-01-10
   - Due Date: 2024-02-10
   - Notes: Test debt
   Click "Add Debt"
   ```
   - ✅ Debt should appear in list immediately
   - ✅ Should show correct amount (Rs. 1,000)
   - ✅ Should show "Lent" badge
   - ✅ Should show status "Active"

3. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → debts
   ```
   - ✅ Should see new row
   - ✅ user_id should match test user
   - ✅ debt_id should be auto-generated (DEBT_1)
   - ✅ All fields should match

---

## Test Scenario 6: Record Debt Return

### Steps:

1. **Record Payment**
   ```
   Click "Record Return" button on the debt
   Fill form:
   - Amount: 300
   - Date: 2024-01-20
   - Notes: Partial payment
   Click "Record Payment"
   ```
   - ✅ Return should be recorded
   - ✅ Debt should show updated remaining amount (700)
   - ✅ Status should change to "Partial"

2. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → debt_returns
   ```
   - ✅ Should see new row
   - ✅ return_id should be auto-generated (RET_1)
   - ✅ debt_id should reference the debt
   - ✅ amount should be 300

3. **Check Debt Calculation**
   ```
   Go back to Debts page
   ```
   - ✅ Original Amount: Rs. 1,000
   - ✅ Returned: Rs. 300
   - ✅ Remaining: Rs. 700
   - ✅ Status: Partial

---

## Test Scenario 7: Create Category

### Steps:

1. **Navigate to Settings**
   ```
   Click "Settings" in sidebar
   Scroll to "Category Management"
   ```

2. **Add New Category**
   ```
   Click "Add Category" button
   Enter name: "Transportation"
   Click "Add Category"
   ```
   - ✅ Category should appear in list immediately

3. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → categories
   ```
   - ✅ Should see new row
   - ✅ category_id should be auto-generated (transportation)
   - ✅ category_name should be "Transportation"
   - ✅ type should be "Expense"

---

## Test Scenario 8: User Data Isolation

### Steps:

1. **Create Second User**
   ```
   Sign out from testuser@example.com
   Navigate to: http://localhost:5173/signup
   Sign up with: testuser2@example.com / password123
   ```

2. **Verify Empty State**
   ```
   Check Dashboard, Expenses, Debts, Settings
   ```
   - ✅ Should show empty state for all pages
   - ✅ Should NOT see testuser's data
   - ✅ Should NOT see sample data

3. **Add Data as Second User**
   ```
   Add an expense:
   - Description: User2 Expense
   - Amount: 100
   ```
   - ✅ Expense should appear

4. **Verify Isolation in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor → expenses
   ```
   - ✅ Should see 2 expenses total
   - ✅ One with user_id = testuser's ID
   - ✅ One with user_id = testuser2's ID
   - ✅ Each user only sees their own data

5. **Switch Back to First User**
   ```
   Sign out from testuser2
   Sign in as testuser@example.com
   ```
   - ✅ Should see only testuser's data
   - ✅ Should NOT see testuser2's data
   - ✅ Should see the expense created earlier

---

## Test Scenario 9: Data Persistence

### Steps:

1. **Add Multiple Records**
   ```
   As testuser@example.com, add:
   - 3 expenses
   - 2 debts
   - 1 debt return
   - 1 category
   ```

2. **Close Browser Completely**
   ```
   Close all browser windows
   ```

3. **Reopen Browser**
   ```
   Open browser
   Navigate to: http://localhost:5173
   ```
   - ✅ Should redirect to login
   - ✅ Sign in with testuser@example.com

4. **Verify Data Persistence**
   ```
   Check all pages
   ```
   - ✅ All expenses should be there
   - ✅ All debts should be there
   - ✅ All debt returns should be there
   - ✅ All categories should be there
   - ✅ Data persists across browser sessions

---

## Test Scenario 10: Excel Import with Supabase

### Steps:

1. **Prepare Excel File**
   ```
   Create Excel file with:
   - Expenses sheet (5 rows)
   - Categories sheet (3 rows)
   ```

2. **Import Excel**
   ```
   Navigate to Settings → Excel Data Management
   Upload Excel file
   Click "Import"
   Confirm import
   ```
   - ✅ Import should succeed
   - ✅ Should show success message with counts

3. **Verify in Supabase**
   ```
   Go to Supabase Dashboard → Table Editor
   ```
   - ✅ expenses table should have 5 new rows
   - ✅ categories table should have 3 new rows
   - ✅ All rows should have correct user_id

4. **Verify in UI**
   ```
   Navigate to Expenses page
   ```
   - ✅ Should see imported expenses
   - ✅ Should see imported categories in dropdowns

---

## Test Scenario 11: Excel Export with Supabase

### Steps:

1. **Export Data**
   ```
   Navigate to Settings → Excel Data Management
   Click "Export to Excel"
   ```
   - ✅ Excel file should download
   - ✅ File should contain all user's data

2. **Verify Excel Content**
   ```
   Open downloaded Excel file
   ```
   - ✅ Should have Expenses sheet with user's expenses
   - ✅ Should have Debts sheet with user's debts
   - ✅ Should have Categories sheet with user's categories
   - ✅ Should NOT have other users' data

---

## Test Scenario 12: Error Handling

### Steps:

1. **Simulate Network Error**
   ```
   Open DevTools → Network tab
   Select "Offline" mode
   Try to add an expense
   ```
   - ✅ Should show error message
   - ✅ Should NOT crash
   - ✅ Should revert optimistic update

2. **Restore Network**
   ```
   Uncheck "Offline" mode
   ```
   - ✅ Should be able to add expense again
   - ✅ Should succeed

3. **Test Invalid Data**
   ```
   Try to add expense with negative amount
   ```
   - ✅ Should show validation error
   - ✅ Should NOT save to database

---

## Test Scenario 13: Concurrent Operations

### Steps:

1. **Open Two Browser Tabs**
   ```
   Tab 1: http://localhost:5173 (as testuser)
   Tab 2: http://localhost:5173 (as testuser)
   ```

2. **Add Expense in Tab 1**
   ```
   Add expense in Tab 1
   ```
   - ✅ Should appear in Tab 1

3. **Refresh Tab 2**
   ```
   Press F5 in Tab 2
   ```
   - ✅ Should see expense added in Tab 1
   - ✅ Data syncs across tabs

---

## Test Scenario 14: Large Dataset Performance

### Steps:

1. **Import Large Excel File**
   ```
   Create Excel with 1000 expenses
   Import via Settings
   ```
   - ✅ Import should complete successfully
   - ✅ Should show correct count

2. **Verify Performance**
   ```
   Navigate to Expenses page
   Scroll through list
   Apply filters
   ```
   - ✅ Should load quickly (< 2 seconds)
   - ✅ Scrolling should be smooth
   - ✅ Filters should work quickly

3. **Check Supabase**
   ```
   Go to Supabase Dashboard → Table Editor
   ```
   - ✅ Should have 1000 rows
   - ✅ All should have correct user_id

---

## Verification Checklist

### Data Loading
- [ ] Data loads after login
- [ ] Data clears after logout
- [ ] Loading state shows during fetch
- [ ] Errors display correctly
- [ ] Empty state handles no data
- [ ] Data persists after refresh

### CRUD Operations
- [ ] Create expense saves to Supabase
- [ ] Update expense saves to Supabase
- [ ] Delete expense removes from Supabase
- [ ] Create debt saves to Supabase
- [ ] Update debt saves to Supabase
- [ ] Delete debt removes from Supabase
- [ ] Create debt return saves to Supabase
- [ ] Delete debt return removes from Supabase
- [ ] Create category saves to Supabase
- [ ] Update category saves to Supabase
- [ ] Delete category removes from Supabase

### User Isolation
- [ ] User A cannot see User B's data
- [ ] User A's operations don't affect User B
- [ ] RLS policies prevent cross-user access
- [ ] Each user has separate data
- [ ] Switching users shows correct data

### Error Handling
- [ ] Network failure shows error
- [ ] Invalid data shows validation error
- [ ] Permission denied shows error
- [ ] Optimistic update reverts on failure
- [ ] Error messages are user-friendly

### Data Persistence
- [ ] Data persists after page refresh
- [ ] Data persists after browser restart
- [ ] Data persists after logout/login
- [ ] Data syncs across tabs
- [ ] Data syncs across devices (if tested)

### Performance
- [ ] Initial load is fast (< 3 seconds)
- [ ] CRUD operations are fast (< 1 second)
- [ ] Large datasets load quickly
- [ ] Filters work quickly
- [ ] No memory leaks

### Excel Integration
- [ ] Import saves to Supabase
- [ ] Export loads from Supabase
- [ ] Only user's data is exported
- [ ] Import validates data
- [ ] Import handles duplicates

---

## Common Issues and Solutions

### Issue: Data not loading
**Symptoms:** Empty state shows, no data in UI
**Solutions:**
1. Check browser console for errors
2. Verify user is authenticated
3. Check Supabase connection
4. Verify RLS policies are correct
5. Check network tab for failed requests

### Issue: Data not saving
**Symptoms:** UI updates but data doesn't persist
**Solutions:**
1. Check browser console for errors
2. Verify user permissions
3. Check table constraints
4. Verify data format matches schema
5. Check Supabase logs

### Issue: Cross-user data access
**Symptoms:** User sees other user's data
**Solutions:**
1. Verify RLS policies are enabled
2. Check all queries include user_id filter
3. Verify user_id is set correctly
4. Check Supabase logs for policy violations

### Issue: Optimistic update not reverting
**Symptoms:** UI shows data but save failed
**Solutions:**
1. Check error handling in FinanceContext
2. Verify revert logic is correct
3. Check console for errors
4. Verify state update logic

---

## Success Criteria

Phase 5 is complete when:
- ✅ All test scenarios pass
- ✅ All checklist items verified
- ✅ No critical bugs remain
- ✅ Data persists correctly
- ✅ User isolation works
- ✅ Error handling is robust
- ✅ Performance is acceptable

---

## Next Steps

After completing all tests:
1. Mark all checklist items as complete
2. Document any issues found
3. Proceed to Phase 6 (Excel Compatibility)

If tests fail:
1. Review the failing test scenario
2. Check troubleshooting section
3. Review code implementation
4. Fix issues and retest

---

## Test Data

### Test Users
```
User 1:
- Email: testuser@example.com
- Password: password123

User 2:
- Email: testuser2@example.com
- Password: password123
```

### Sample Data
```
Expenses:
- Test Expense 1: Rs. 50, Food, Cash
- Test Expense 2: Rs. 75, Transport, Card
- Test Expense 3: Rs. 100, Shopping, Cash

Debts:
- John Doe: Lent Rs. 1,000
- Jane Smith: Borrowed Rs. 500

Debt Returns:
- John Doe: Rs. 300 (partial)

Categories:
- Transportation
- Entertainment
```

---

**Status:** Ready for testing
**Estimated Time:** 2-3 hours for complete testing
