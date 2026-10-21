# Security & Inactivity Timeout - Testing Guide

## Overview

This guide provides step-by-step instructions for testing the security improvements and 2-minute inactivity timeout implementation.

**Prerequisites:**
- Two Supabase user accounts (User A and User B)
- Access to Supabase Dashboard SQL Editor
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Application deployed and accessible

---

## Part 1: Security Testing

### Test 1.1: Query Optimization Verification

**Objective:** Verify that queries fetch only necessary columns

**Steps:**
1. Open browser DevTools (F12)
2. Navigate to Network tab
3. Log in to application
4. Navigate to Expenses page
5. Find the Supabase API call in Network tab
6. Inspect the request payload
7. **Expected:** Query should specify explicit columns, not `select('*')`

**Example Request:**
```json
{
  "query": "SELECT expense_id, date, description, category, amount, payment_method, notes FROM expenses WHERE user_id = '...'"
}
```

**Verify for Each Page:**
- [ ] Expenses page - 7 columns
- [ ] Debts page - 8 columns
- [ ] Debt Returns - 5 columns
- [ ] Categories - 3 columns

---

### Test 1.2: Cross-User Data Isolation

**Objective:** Verify User B cannot access User A's data

**Setup:**
1. Create User A account (e.g., userA@test.com)
2. Create User B account (e.g., userB@test.com)

**Steps:**

#### Step 1: Create Data as User A
1. Log in as User A
2. Create 3 expenses:
   - Expense 1: Rs. 100, Food, 2024-01-01
   - Expense 2: Rs. 200, Transport, 2024-01-02
   - Expense 3: Rs. 300, Shopping, 2024-01-03
3. Create 2 debts:
   - Debt 1: Lent Rs. 1000 to John
   - Debt 2: Borrowed Rs. 500 from Jane
4. Create 1 debt return:
   - Return Rs. 200 for Debt 1
5. Create 1 custom category:
   - "User A Category"
6. Note down all record IDs from database (use Supabase SQL Editor):
   ```sql
   SELECT expense_id, description FROM expenses WHERE user_id = 'USER_A_UUID';
   SELECT debt_id, person FROM debts WHERE user_id = 'USER_A_UUID';
   ```

#### Step 2: Verify Isolation as User B
1. Log out from User A
2. Log in as User B
3. Navigate to Expenses page
4. **Expected:** 0 expenses visible
5. Navigate to Debts page
6. **Expected:** 0 debts visible
7. Navigate to Settings → Categories
8. **Expected:** Only default categories visible (no "User A Category")

#### Step 3: Attempt Direct Access
1. While logged in as User B, open browser console
2. Try to fetch User A's expense:
   ```javascript
   const { data, error } = await supabase
     .from('expenses')
     .select('*')
     .eq('expense_id', 'USER_A_EXPENSE_ID');
   console.log('Data:', data);
   console.log('Error:', error);
   ```
3. **Expected:** `data = []` (empty array), `error = null`

#### Step 4: Attempt Update
1. Try to update User A's expense:
   ```javascript
   const { data, error } = await supabase
     .from('expenses')
     .update({ amount: 9999 })
     .eq('expense_id', 'USER_A_EXPENSE_ID');
   console.log('Data:', data);
   console.log('Error:', error);
   ```
2. **Expected:** `data = []` (update failed silently)

#### Step 5: Attempt Delete
1. Try to delete User A's expense:
   ```javascript
   const { error } = await supabase
     .from('expenses')
     .delete()
     .eq('expense_id', 'USER_A_EXPENSE_ID');
   console.log('Error:', error);
   ```
2. **Expected:** No error, but 0 rows affected

**Verification SQL:**
```sql
-- Run as User B in Supabase SQL Editor
-- Should return 0 rows
SELECT * FROM expenses WHERE expense_id = 'USER_A_EXPENSE_ID';

-- Should return User A's data (verify it still exists)
SELECT * FROM expenses WHERE user_id = 'USER_A_UUID';
```

---

### Test 1.3: Debt Return Cross-User Prevention

**Objective:** Verify User B cannot create debt returns for User A's debts

**Steps:**
1. Log in as User A
2. Create debt with ID "DEBT_1"
3. Note the debt UUID from database
4. Log out
5. Log in as User B
6. Try to create debt return for User A's debt:
   ```javascript
   const { data, error } = await supabase
     .from('debt_returns')
     .insert({
       user_id: 'USER_B_UUID',
       debt_id: 'DEBT_1',
       return_id: 'RETURN_1',
       amount: 50,
       date: '2024-01-01'
     });
   console.log('Data:', data);
   console.log('Error:', error);
   ```
7. **Expected:** Error - RLS policy prevents insert

**Verification SQL:**
```sql
-- Should return 0 rows
SELECT * FROM debt_returns WHERE debt_id = 'DEBT_1' AND user_id = 'USER_B_UUID';
```

---

### Test 1.4: RLS Policy Verification

**Objective:** Verify RLS is enabled and policies are correct

**Steps:**
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following queries:

#### Check RLS Enabled
```sql
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('expenses', 'debts', 'debt_returns', 'categories');
```
**Expected:** All tables show `rowsecurity = true`

#### Check Policies Exist
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```
**Expected:** 16 policies (4 per table × 4 tables)

#### Verify Policy Details
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'expenses';
```
**Expected:**
- SELECT policy: `qual = (auth.uid() = user_id)`
- INSERT policy: `with_check = (auth.uid() = user_id)`
- UPDATE policy: `qual = (auth.uid() = user_id)`, `with_check = (auth.uid() = user_id)`
- DELETE policy: `qual = (auth.uid() = user_id)`

---

### Test 1.5: No Service Role Key Exposure

**Objective:** Verify service role key is not in frontend code

**Steps:**
1. Search codebase for service role key:
   ```bash
   grep -r "service_role" src/
   grep -r "SERVICE_ROLE" src/
   grep -r "supabase-service-role" src/
   ```
2. **Expected:** No results

3. Check environment variables:
   ```bash
   cat .env.local
   ```
4. **Expected:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` present

5. Check built files:
   ```bash
   grep -r "service_role" dist/
   ```
6. **Expected:** No results

---

## Part 2: Inactivity Timeout Testing

### Test 2.1: Basic Timeout

**Objective:** Verify user is logged out after 2 minutes of inactivity

**Steps:**
1. Log in to application
2. Open browser console (F12)
3. Do NOT interact with the app (no mouse movement, keyboard input, or scrolling)
4. Wait 2 minutes
5. **Expected:**
   - Alert appears: "You were signed out due to 2 minutes of inactivity. Please sign in again."
   - User is redirected to `/login` page
   - Attempting to access `/dashboard` redirects to `/login`

**Browser Console Check:**
```javascript
// Should see timer logs (if enabled)
// No errors should appear
```

---

### Test 2.2: Activity Resets Timer

**Objective:** Verify user activity resets the inactivity timer

**Steps:**
1. Log in to application
2. Wait 1 minute 30 seconds
3. Move mouse or press a key
4. Wait another 1 minute 30 seconds (total 3 minutes from login)
5. **Expected:** User is still logged in (timer reset at 1:30)
6. Stop all activity
7. Wait 2 minutes
8. **Expected:** User is logged out

**Timing Breakdown:**
```
0:00 - Login, timer starts
1:30 - User activity, timer resets
3:00 - Still logged in (only 1:30 since last activity)
3:00 - Stop activity
5:00 - Logged out (2:00 since last activity)
```

---

### Test 2.3: Tab Visibility Handling

**Objective:** Verify timeout behavior when tab is hidden

**Test A: Short Hidden Period**
1. Log in to application
2. Switch to another browser tab
3. Wait 1 minute
4. Return to application tab
5. **Expected:** User still logged in (only 1 minute passed)
6. Stop all activity
7. Wait 2 minutes
8. **Expected:** User is logged out

**Test B: Long Hidden Period**
1. Log in to application
2. Switch to another browser tab
3. Wait 3 minutes
4. Return to application tab
5. **Expected:** 
   - Immediate logout
   - Alert message shown
   - Redirected to login

---

### Test 2.4: Multi-Tab Synchronization

**Objective:** Verify timeout works across multiple tabs

**Test A: Activity in One Tab**
1. Open application in two browser tabs (Tab A and Tab B)
2. Log in in both tabs (same user)
3. Be active in Tab A (move mouse, type, etc.)
4. Stop all activity in both tabs
5. Wait 2 minutes
6. **Expected:** Both tabs log out simultaneously

**Test B: Activity Keeps Both Alive**
1. Open application in two tabs
2. Log in in both tabs
3. Be active in Tab A only
4. Wait 3 minutes
5. **Expected:** Both tabs stay logged in (Tab A activity resets both timers)

---

### Test 2.5: Public Routes Exclusion

**Objective:** Verify timeout doesn't activate on public routes

**Steps:**
1. Navigate to `/login` page
2. Wait 3 minutes
3. **Expected:** User is NOT logged out (still on login page)
4. Navigate to `/signup` page
5. Wait 3 minutes
6. **Expected:** User is NOT logged out
7. Navigate to `/reset-password` page
8. Wait 3 minutes
9. **Expected:** User is NOT logged out

---

### Test 2.6: Manual Logout

**Objective:** Verify manual logout works correctly

**Steps:**
1. Log in to application
2. Click user menu in header
3. Click "Sign out"
4. **Expected:** 
   - User is logged out immediately
   - Redirected to `/login`
   - Inactivity timer is cleared
   - No timeout alert shown

---

### Test 2.7: Session Restoration

**Objective:** Verify timeout works after page refresh

**Steps:**
1. Log in to application
2. Refresh the page (F5)
3. Wait 2 minutes without activity
4. **Expected:** User is logged out after 2 minutes

---

### Test 2.8: Browser Notification

**Objective:** Verify browser notification is shown (if permitted)

**Prerequisites:**
- Browser notifications must be enabled for the site
- User must have granted notification permission

**Steps:**
1. Log in to application
2. When prompted, allow notifications
3. Wait 2 minutes without activity
4. **Expected:** 
   - Browser notification appears: "Session Expired"
   - Notification body: "You were signed out due to 2 minutes of inactivity. Please sign in again."
   - Alert dialog also shown
   - User redirected to login

**Check Notification Permission:**
```javascript
// In browser console
console.log(Notification.permission);
// Expected: "granted"
```

---

## Part 3: Regression Testing

### Test 3.1: Login Flow

**Steps:**
1. Navigate to `/login`
2. Enter valid credentials
3. Click "Sign in"
4. **Expected:** Redirected to `/dashboard`, user data loads

---

### Test 3.2: Normal Activity

**Steps:**
1. Log in
2. Navigate between pages:
   - Dashboard
   - Expenses
   - Debts
   - Reports
   - Settings
3. Create/edit/delete records
4. **Expected:** All operations work normally, no unexpected logouts

---

### Test 3.3: Data Persistence

**Steps:**
1. Log in
2. Create expense
3. Wait 1 minute
4. Create another expense
5. **Expected:** Both expenses saved, user still logged in

---

### Test 3.4: Excel Import/Export

**Steps:**
1. Log in
2. Navigate to Settings
3. Export data to Excel
4. **Expected:** Excel file downloads with correct data
5. Import data from Excel
6. **Expected:** Data imported successfully

---

### Test 3.5: Protected Route Access

**Steps:**
1. Log out
2. Try to access `/dashboard` directly
3. **Expected:** Redirected to `/login`
4. Log in
5. Access `/dashboard`
6. **Expected:** Dashboard loads normally

---

### Test 3.6: Debt Operations

**Steps:**
1. Log in
2. Create debt
3. Record debt return
4. Verify outstanding balance calculates correctly
5. **Expected:** All debt operations work normally

---

### Test 3.7: Report Generation

**Steps:**
1. Log in
2. Navigate to Reports
3. Generate monthly report
4. Generate annual report
5. **Expected:** Reports display correctly with accurate data

---

## Part 4: Performance Testing

### Test 4.1: Query Performance

**Objective:** Verify optimized queries are faster

**Steps:**
1. Open browser DevTools → Network tab
2. Log in
3. Navigate to Expenses page (with 100+ expenses)
4. Check query response time
5. **Expected:** Response time < 500ms

**Compare:**
- Before optimization: ~500-1000ms
- After optimization: ~200-500ms

---

### Test 4.2: Payload Size

**Objective:** Verify reduced payload size

**Steps:**
1. Open browser DevTools → Network tab
2. Log in
3. Navigate to Expenses page
4. Check response size
5. **Expected:** Smaller payload (only necessary columns)

**Example:**
- Before: ~500 bytes per record
- After: ~320 bytes per record (36% reduction)

---

## Part 5: Cross-Browser Testing

### Test 5.1: Chrome
- [ ] Login works
- [ ] Inactivity timeout works
- [ ] Tab visibility handling works
- [ ] Multi-tab sync works
- [ ] Notifications work

### Test 5.2: Firefox
- [ ] Login works
- [ ] Inactivity timeout works
- [ ] Tab visibility handling works
- [ ] Multi-tab sync works
- [ ] Notifications work

### Test 5.3: Safari
- [ ] Login works
- [ ] Inactivity timeout works
- [ ] Tab visibility handling works
- [ ] Multi-tab sync works
- [ ] Notifications work

### Test 5.4: Edge
- [ ] Login works
- [ ] Inactivity timeout works
- [ ] Tab visibility handling works
- [ ] Multi-tab sync works
- [ ] Notifications work

---

## Part 6: Mobile Testing

### Test 6.1: Touch Activity Detection
1. Log in on mobile device
2. Tap screen
3. Scroll page
4. **Expected:** Timer resets

### Test 6.2: Background/Foreground
1. Log in on mobile
2. Switch to another app
3. Wait 3 minutes
4. Return to app
5. **Expected:** Immediate logout

### Test 6.3: Responsive Layout
1. Log in on mobile
2. Navigate all pages
3. **Expected:** Layout works correctly, timeout functions properly

---

## Test Results Template

Use this template to document test results:

```markdown
## Test Results

**Date:** [YYYY-MM-DD]
**Tester:** [Name]
**Environment:** [Browser/Version, OS]

### Security Tests
- [ ] Test 1.1: Query Optimization - PASS/FAIL
- [ ] Test 1.2: Cross-User Isolation - PASS/FAIL
- [ ] Test 1.3: Debt Return Prevention - PASS/FAIL
- [ ] Test 1.4: RLS Verification - PASS/FAIL
- [ ] Test 1.5: No Service Role Key - PASS/FAIL

### Timeout Tests
- [ ] Test 2.1: Basic Timeout - PASS/FAIL
- [ ] Test 2.2: Activity Reset - PASS/FAIL
- [ ] Test 2.3: Tab Visibility - PASS/FAIL
- [ ] Test 2.4: Multi-Tab Sync - PASS/FAIL
- [ ] Test 2.5: Public Routes - PASS/FAIL
- [ ] Test 2.6: Manual Logout - PASS/FAIL
- [ ] Test 2.7: Session Restoration - PASS/FAIL
- [ ] Test 2.8: Browser Notification - PASS/FAIL

### Regression Tests
- [ ] Test 3.1: Login Flow - PASS/FAIL
- [ ] Test 3.2: Normal Activity - PASS/FAIL
- [ ] Test 3.3: Data Persistence - PASS/FAIL
- [ ] Test 3.4: Excel Import/Export - PASS/FAIL
- [ ] Test 3.5: Protected Routes - PASS/FAIL
- [ ] Test 3.6: Debt Operations - PASS/FAIL
- [ ] Test 3.7: Report Generation - PASS/FAIL

### Performance Tests
- [ ] Test 4.1: Query Performance - PASS/FAIL
- [ ] Test 4.2: Payload Size - PASS/FAIL

### Cross-Browser Tests
- [ ] Chrome - PASS/FAIL
- [ ] Firefox - PASS/FAIL
- [ ] Safari - PASS/FAIL
- [ ] Edge - PASS/FAIL

### Mobile Tests
- [ ] Test 6.1: Touch Activity - PASS/FAIL
- [ ] Test 6.2: Background/Foreground - PASS/FAIL
- [ ] Test 6.3: Responsive Layout - PASS/FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations or recommendations]
```

---

## Troubleshooting Common Issues

### Issue: Tests fail on step 1.2 (Cross-User Isolation)
**Possible Causes:**
- RLS not enabled in Supabase
- Policies not created correctly
- Using service role key in frontend

**Solution:**
1. Verify RLS enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
2. Reapply migration 002 if needed
3. Check for service role key in code

### Issue: Tests fail on step 2.1 (Basic Timeout)
**Possible Causes:**
- Hook not integrated in Layout
- Timer not starting
- Activity events not firing

**Solution:**
1. Check browser console for errors
2. Verify `useInactivityTimeout` is called in Layout.jsx
3. Check if user is authenticated
4. Verify not on public route

### Issue: Tests fail on step 2.3 (Tab Visibility)
**Possible Causes:**
- Visibility API not supported
- Timer not pausing/resuming correctly

**Solution:**
1. Check browser compatibility
2. Verify `document.hidden` is working
3. Check console for visibility change logs

---

## Success Criteria

All tests pass when:
- ✅ Security tests verify data isolation
- ✅ Timeout tests verify 2-minute inactivity logout
- ✅ Regression tests verify existing functionality works
- ✅ Performance tests show improvement
- ✅ Cross-browser tests pass on all major browsers
- ✅ Mobile tests pass on touch devices

---

**Testing Status:** [ ] Ready for Testing  
**Last Updated:** 2026-01-29  
**Tested By:** [Pending]  
**Approved By:** [Pending]
