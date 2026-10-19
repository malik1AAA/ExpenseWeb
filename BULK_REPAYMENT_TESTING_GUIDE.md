# Bulk Repayment Testing Guide

## Overview

This guide provides comprehensive test scenarios for the bulk repayment allocation feature. Each test case includes setup steps, actions, expected results, and verification steps.

## Prerequisites

Before testing, ensure:
- ✅ Supabase migration `003_bulk_repayment_rpc.sql` applied
- ✅ Dev server running (`npm run dev`)
- ✅ Test user authenticated
- ✅ Test debts created (see Test Data Setup below)

---

## Test Data Setup

### Create Test Debts

Use the following data to create test debts in the application:

```javascript
// Person: Ahmed, Direction: Lent, Category: Food
Debt 1: {
  person: 'Ahmed',
  direction: 'Lent',
  debt_category: 'Food',
  original_amount: 125,
  date: '2026-01-01',
  due_date: '2026-02-01'
}

Debt 2: {
  person: 'Ahmed',
  direction: 'Lent',
  debt_category: 'Food',
  original_amount: 150,
  date: '2026-01-05',
  due_date: '2026-02-05'
}

// Person: Ahmed, Direction: Lent, Category: Cash
Debt 3: {
  person: 'Ahmed',
  direction: 'Lent',
  debt_category: 'Cash',
  original_amount: 200,
  date: '2026-01-03',
  due_date: '2026-02-03'
}

// Person: Ahmed, Direction: Borrowed, Category: Food
Debt 4: {
  person: 'Ahmed',
  direction: 'Borrowed',
  debt_category: 'Food',
  original_amount: 100,
  date: '2026-01-02',
  due_date: '2026-02-02'
}

// Person: Sara, Direction: Lent, Category: Food (different person)
Debt 5: {
  person: 'Sara',
  direction: 'Lent',
  debt_category: 'Food',
  original_amount: 300,
  date: '2026-01-04',
  due_date: '2026-02-04'
}
```

---

## Test Case 1: Basic Allocation (Exact Match)

**Scenario:** Rs. 125 + Rs. 150 outstanding; pay Rs. 275 (exact total)

**Setup:**
- Debt 1: Rs. 125 remaining (no prior returns)
- Debt 2: Rs. 150 remaining (no prior returns)
- Total outstanding: Rs. 275

**Steps:**
1. Navigate to Debts page
2. Click "Record Bulk Repayment" button
3. Select Person: "Ahmed"
4. Select Direction: "Lent"
5. Select Debt Category: "Food"
6. Verify: Eligible Debts = 2, Total Outstanding = Rs. 275
7. Click "Next"
8. Enter Amount: 275
9. Enter Date: 2026-01-29
10. Enter Notes: "Test case 1 - exact match"
11. Verify preview shows:
    - Debt 1: Allocating Rs. 125, Remaining after: Rs. 0 ✓ Fully settled
    - Debt 2: Allocating Rs. 150, Remaining after: Rs. 0 ✓ Fully settled
12. Click "Confirm & Save"
13. Verify success message: "2 allocations recorded"

**Expected Result:**
- Both debts fully settled
- Two debt_returns records created
- Debt 1 remaining: Rs. 0
- Debt 2 remaining: Rs. 0
- Total paid: Rs. 275

**Verification:**
```sql
-- Check debt_returns records
SELECT debt_id, amount, notes, date 
FROM debt_returns 
WHERE notes = 'Test case 1 - exact match'
ORDER BY date;

-- Expected:
-- DEBT_1 | 125.00 | Test case 1 - exact match | 2026-01-29
-- DEBT_2 | 150.00 | Test case 1 - exact match | 2026-01-29

-- Verify remaining balances
SELECT 
  d.debt_id,
  d.original_amount,
  COALESCE(SUM(r.amount), 0) as total_returned,
  d.original_amount - COALESCE(SUM(r.amount), 0) as remaining
FROM debts d
LEFT JOIN debt_returns r ON d.debt_id = r.debt_id
WHERE d.person = 'Ahmed' 
  AND d.direction = 'Lent' 
  AND d.debt_category = 'Food'
  AND d.debt_id IN ('DEBT_1', 'DEBT_2')
GROUP BY d.debt_id, d.original_amount;

-- Expected:
-- DEBT_1 | 125.00 | 125.00 | 0.00
-- DEBT_2 | 150.00 | 150.00 | 0.00
```

**Status:** ⏳ Pending manual test

---

## Test Case 2: Partial Allocation (Oldest First)

**Scenario:** Same debts; pay Rs. 100 (less than first debt)

**Setup:**
- Debt 1: Rs. 125 remaining
- Debt 2: Rs. 150 remaining
- Payment: Rs. 100

**Steps:**
1. Click "Record Bulk Repayment"
2. Select Person: "Ahmed", Direction: "Lent", Category: "Food"
3. Click "Next"
4. Enter Amount: 100
5. Enter Date: 2026-01-29
6. Verify preview shows:
    - Debt 1: Allocating Rs. 100, Remaining after: Rs. 25
    - Debt 2: NOT in preview (payment exhausted)
7. Click "Confirm & Save"

**Expected Result:**
- Only Debt 1 receives allocation
- Debt 1 remaining: Rs. 25
- Debt 2 remaining: Rs. 150 (unchanged)
- One debt_return record created

**Verification:**
```sql
SELECT debt_id, amount FROM debt_returns 
WHERE notes LIKE '%Test case 2%'
ORDER BY date;

-- Expected:
-- DEBT_1 | 100.00
```

**Status:** ⏳ Pending manual test

---

## Test Case 3: Full Settlement

**Scenario:** Same debts; pay Rs. 275 (both fully settled)

**Setup:**
- Debt 1: Rs. 125 remaining
- Debt 2: Rs. 150 remaining
- Payment: Rs. 275

**Steps:**
1. Click "Record Bulk Repayment"
2. Select Person: "Ahmed", Direction: "Lent", Category: "Food"
3. Click "Next"
4. Enter Amount: 275
5. Verify preview shows both debts fully settled
6. Click "Confirm & Save"

**Expected Result:**
- Both debts fully settled
- Two debt_returns records created
- Debt 1 remaining: Rs. 0
- Debt 2 remaining: Rs. 0

**Status:** ⏳ Pending manual test

---

## Test Case 4: Payment Exceeds Outstanding (Rejected)

**Scenario:** Same debts; attempt Rs. 300 (more than outstanding)

**Setup:**
- Debt 1: Rs. 125 remaining
- Debt 2: Rs. 150 remaining
- Total outstanding: Rs. 275
- Payment attempt: Rs. 300

**Steps:**
1. Click "Record Bulk Repayment"
2. Select Person: "Ahmed", Direction: "Lent", Category: "Food"
3. Click "Next"
4. Enter Amount: 300
5. Verify error message appears: "Payment amount (300) exceeds total outstanding (275)"
6. Verify "Confirm & Save" button is disabled

**Expected Result:**
- Client-side validation prevents submission
- Clear error message displayed
- Cannot proceed with invalid amount

**Status:** ⏳ Pending manual test

---

## Test Case 5: Partially Paid Debt

**Scenario:** First debt already partially paid

**Setup:**
- Debt 1: Rs. 125 original, Rs. 50 already returned, Rs. 75 remaining
- Debt 2: Rs. 150 remaining
- Payment: Rs. 200

**Steps:**
1. First, record individual return of Rs. 50 for Debt 1
2. Click "Record Bulk Repayment"
3. Select Person: "Ahmed", Direction: "Lent", Category: "Food"
4. Verify: Eligible Debts = 2, Total Outstanding = Rs. 225 (75 + 150)
5. Click "Next"
6. Enter Amount: 200
7. Verify preview shows:
    - Debt 1: Allocating Rs. 75, Remaining after: Rs. 0 ✓ Fully settled
    - Debt 2: Allocating Rs. 125, Remaining after: Rs. 25
8. Click "Confirm & Save"

**Expected Result:**
- Debt 1 fully settled (Rs. 75 allocated)
- Debt 2 partially settled (Rs. 125 allocated, Rs. 25 remaining)
- Two debt_returns records created
- Total paid: Rs. 200

**Verification:**
```sql
-- Debt 1 should have 3 returns total (50 + 75 from bulk)
SELECT SUM(amount) FROM debt_returns WHERE debt_id = 'DEBT_1';
-- Expected: 125.00

-- Debt 2 should have 1 return (125 from bulk)
SELECT SUM(amount) FROM debt_returns WHERE debt_id = 'DEBT_2';
-- Expected: 125.00
```

**Status:** ⏳ Pending manual test

---

## Test Case 6: Direction Filtering

**Scenario:** Person has debts in both directions; allocate only to selected direction

**Setup:**
- Ahmed, Lent, Food: Rs. 125 + Rs. 150 = Rs. 275 outstanding
- Ahmed, Borrowed, Food: Rs. 100 outstanding
- Payment: Rs. 200 (Lent direction)

**Steps:**
1. Click "Record Bulk Repayment"
2. Select Person: "Ahmed"
3. Select Direction: "Lent"
4. Select Category: "Food"
5. Verify: Eligible Debts = 2, Total Outstanding = Rs. 275
6. Verify Debt 4 (Borrowed) is NOT in eligible list
7. Click "Next"
8. Enter Amount: 200
9. Verify preview allocates only to Lent debts
10. Click "Confirm & Save"

**Expected Result:**
- Only Lent debts receive allocation
- Borrowed debt unchanged
- Two debt_returns records created for Lent debts

**Verification:**
```sql
-- Verify no returns created for Borrowed debt
SELECT COUNT(*) FROM debt_returns 
WHERE debt_id = 'DEBT_4';
-- Expected: 0
```

**Status:** ⏳ Pending manual test

---

## Test Case 7: Category Filtering

**Scenario:** Person has debts in different categories; allocate only to selected category

**Setup:**
- Ahmed, Lent, Food: Rs. 275 outstanding
- Ahmed, Lent, Cash: Rs. 200 outstanding
- Payment: Rs. 150 (Cash category)

**Steps:**
1. Click "Record Bulk Repayment"
2. Select Person: "Ahmed"
3. Select Direction: "Lent"
4. Select Category: "Cash"
5. Verify: Eligible Debts = 1, Total Outstanding = Rs. 200
6. Verify Food debts are NOT in eligible list
7. Click "Next"
8. Enter Amount: 150
9. Verify preview allocates only to Cash debt
10. Click "Confirm & Save"

**Expected Result:**
- Only Cash debt receives allocation
- Food debts unchanged
- One debt_return record created

**Status:** ⏳ Pending manual test

---

## Test Case 8: Multi-User Isolation

**Scenario:** Two users have debts for people with the same name; never mix records

**Setup:**
- User A: Ahmed (Lent, Food) Rs. 100
- User B: Ahmed (Lent, Food) Rs. 200

**Steps:**
1. Log in as User A
2. Click "Record Bulk Repayment"
3. Select Person: "Ahmed"
4. Verify: Total Outstanding = Rs. 100 (only User A's debt)
5. Enter Amount: 100
6. Click "Confirm & Save"
7. Log out, log in as User B
8. Click "Record Bulk Repayment"
9. Select Person: "Ahmed"
10. Verify: Total Outstanding = Rs. 200 (only User B's debt)
11. Verify User A's repayment is NOT visible

**Expected Result:**
- Each user sees only their own debts
- No cross-user data leakage
- RLS policies enforced

**Verification:**
```sql
-- As User A, check debt_returns
SELECT COUNT(*) FROM debt_returns WHERE user_id = 'USER_A_ID';
-- Expected: 1

-- As User B, check debt_returns
SELECT COUNT(*) FROM debt_returns WHERE user_id = 'USER_B_ID';
-- Expected: 0 (User B hasn't made any repayments yet)
```

**Status:** ⏳ Pending manual test

---

## Test Case 9: Zero Amount (Rejected)

**Scenario:** Attempt to pay Rs. 0

**Steps:**
1. Click "Record Bulk Repayment"
2. Select person, direction, category
3. Click "Next"
4. Enter Amount: 0
5. Verify error message: "Payment amount must be greater than zero"
6. Verify "Confirm & Save" button is disabled

**Expected Result:**
- Client-side validation prevents submission
- Clear error message displayed

**Status:** ⏳ Pending manual test

---

## Test Case 10: Negative Amount (Rejected)

**Scenario:** Attempt to pay negative amount

**Steps:**
1. Click "Record Bulk Repayment"
2. Select person, direction, category
3. Click "Next"
4. Enter Amount: -100
5. Verify error message: "Payment amount must be greater than zero"
6. Verify "Confirm & Save" button is disabled

**Expected Result:**
- Client-side validation prevents submission
- Clear error message displayed

**Status:** ⏳ Pending manual test

---

## Test Case 11: No Eligible Debts

**Scenario:** Person has no outstanding debts for selected direction/category

**Setup:**
- Ahmed, Lent, Food: All debts fully settled (remaining = 0)

**Steps:**
1. Click "Record Bulk Repayment"
2. Select Person: "Ahmed"
3. Select Direction: "Lent"
4. Select Category: "Food"
5. Verify: Eligible Debts = 0, Total Outstanding = Rs. 0
6. Verify message: "No outstanding debts found..."
7. Verify "Next" button is disabled

**Expected Result:**
- Cannot proceed with no eligible debts
- Clear message displayed
- "Next" button disabled

**Status:** ⏳ Pending manual test

---

## Test Case 12: Same Date, Multiple Debts (Deterministic Ordering)

**Scenario:** Multiple debts with same date; verify deterministic ordering by debt_id

**Setup:**
- Debt A: date = 2026-01-01, debt_id = "DEBT_A"
- Debt B: date = 2026-01-01, debt_id = "DEBT_B"
- Payment: Rs. 150 (enough for Debt A, partial for Debt B)

**Steps:**
1. Click "Record Bulk Repayment"
2. Select appropriate person/direction/category
3. Click "Next"
4. Enter Amount: 150
5. Verify preview shows Debt A allocated first (alphabetically first debt_id)
6. Click "Confirm & Save"

**Expected Result:**
- Debt A receives allocation first
- Debt B receives remaining (if any)
- Ordering is deterministic and predictable

**Status:** ⏳ Pending manual test

---

## Test Case 13: Database Failure Simulation

**Scenario:** Simulate database failure during saving; verify no partial commits

**Setup:**
- Temporarily break Supabase connection or RLS policy

**Steps:**
1. Click "Record Bulk Repayment"
2. Select person, direction, category
3. Click "Next"
4. Enter valid amount
5. Click "Confirm & Save"
6. Simulate failure (e.g., revoke RLS policy temporarily)
7. Verify error message displayed
8. Verify NO debt_returns records created
9. Restore connection/policy
10. Retry operation
11. Verify success

**Expected Result:**
- Atomic transaction ensures no partial commits
- Error message displayed
- Can retry after fixing issue
- No duplicate allocations

**Status:** ⏳ Pending manual test

---

## Test Case 14: Concurrent Modifications

**Scenario:** Debt modified between preview and commit

**Setup:**
- User A previews bulk repayment
- User B (or another session) modifies a debt
- User A commits

**Steps:**
1. Open two browser tabs as same user
2. Tab 1: Click "Record Bulk Repayment"
3. Tab 1: Select person, direction, category
4. Tab 1: Click "Next"
5. Tab 2: Modify one of the debts (e.g., record individual return)
6. Tab 1: Enter amount (based on old outstanding)
7. Tab 1: Click "Confirm & Save"
8. Verify server-side validation catches the change
9. Verify appropriate error message or successful allocation with correct amounts

**Expected Result:**
- Server re-validates outstanding balance at commit time
- If amount now exceeds outstanding, error displayed
- If amount is valid, allocation proceeds with correct amounts
- No double-allocation possible

**Status:** ⏳ Pending manual test

---

## Test Case 15: Large Number of Debts

**Scenario:** Person has 50+ outstanding debts; verify performance

**Setup:**
- Create 50 debts for same person/direction/category
- Each debt: Rs. 100
- Total outstanding: Rs. 5,000

**Steps:**
1. Click "Record Bulk Repayment"
2. Select person, direction, category
3. Verify: Eligible Debts = 50, Total Outstanding = Rs. 5,000
4. Verify preview loads quickly (< 1 second)
5. Click "Next"
6. Enter Amount: 2,500
7. Verify preview shows first 25 debts allocated
8. Verify preview loads quickly (< 1 second)
9. Click "Confirm & Save"
10. Verify success message: "25 allocations recorded"
11. Verify operation completes in < 5 seconds

**Expected Result:**
- UI remains responsive with many debts
- Preview calculates quickly
- Commit completes in reasonable time
- All allocations correct

**Status:** ⏳ Pending manual test

---

## Test Case 16: Audit Trail Verification

**Scenario:** Verify all bulk repayment records have shared notes for audit trail

**Steps:**
1. Perform bulk repayment with notes: "October bulk payment"
2. Navigate to individual debt details
3. Verify payment history shows the return
4. Verify notes field contains "October bulk payment"
5. Check database:
```sql
SELECT return_id, debt_id, amount, notes 
FROM debt_returns 
WHERE notes = 'October bulk payment'
ORDER BY date;
```

**Expected Result:**
- All returns from same bulk repayment have identical notes
- Each return has unique return_id
- Each return linked to correct debt_id
- Audit trail is clear and traceable

**Status:** ⏳ Pending manual test

---

## Test Case 17: Back Navigation

**Scenario:** User navigates back from preview to selection step

**Steps:**
1. Click "Record Bulk Repayment"
2. Select person, direction, category
3. Click "Next"
4. Enter amount, date, notes
5. Click "← Back"
6. Verify selection step shown
7. Verify all selections preserved
8. Change person
9. Click "Next"
10. Verify preview updates with new person's debts
11. Verify amount field cleared (or preserved, depending on UX decision)

**Expected Result:**
- Can navigate back and forth
- Selections preserved when going back
- Preview updates when selections change

**Status:** ⏳ Pending manual test

---

## Test Case 18: Modal Close During Submission

**Scenario:** User tries to close modal while submission in progress

**Steps:**
1. Click "Record Bulk Repayment"
2. Complete selection and preview
3. Click "Confirm & Save"
4. While loading, try to close modal (click X or backdrop)
5. Verify modal does NOT close
6. Verify submission continues
7. Verify success/error shown after completion

**Expected Result:**
- Modal cannot be closed during submission
- Prevents accidental cancellation
- User must wait for operation to complete

**Status:** ⏳ Pending manual test

---

## Test Case 19: Refresh After Success

**Scenario:** Verify data refreshes after successful bulk repayment

**Steps:**
1. Perform successful bulk repayment
2. Verify success message shown
3. Close modal
4. Verify debts table updated
5. Verify remaining balances correct
6. Verify debt details show new returns
7. Verify dashboard statistics updated

**Expected Result:**
- All data refreshed automatically
- No manual refresh needed
- UI reflects new state immediately

**Status:** ⏳ Pending manual test

---

## Test Case 20: Edge Case - Exact Remaining Balance

**Scenario:** Payment exactly equals one debt's remaining balance

**Setup:**
- Debt 1: Rs. 100 remaining
- Debt 2: Rs. 150 remaining
- Payment: Rs. 100 (exactly Debt 1's remaining)

**Steps:**
1. Click "Record Bulk Repayment"
2. Select person, direction, category
3. Click "Next"
4. Enter Amount: 100
5. Verify preview shows:
    - Debt 1: Allocating Rs. 100, Remaining after: Rs. 0 ✓ Fully settled
    - Debt 2: NOT in preview (payment exhausted)
6. Click "Confirm & Save"

**Expected Result:**
- Debt 1 fully settled
- Debt 2 unchanged
- One debt_return record created

**Status:** ⏳ Pending manual test

---

## Regression Tests

### Individual Debt Return Still Works
1. Navigate to individual debt
2. Click "Record Return" button
3. Enter amount, date, notes
4. Verify individual return works as before
5. Verify no interference with bulk repayment feature

### Debt CRUD Still Works
1. Add new debt
2. Edit existing debt
3. Delete debt
4. Verify all operations work normally

### Debt Details Still Works
1. Click on debt row
2. Verify details modal opens
3. Verify payment history shows all returns (individual + bulk)
4. Verify remaining balance calculated correctly

---

## Performance Tests

### Preview Calculation Speed
- 10 debts: < 100ms
- 50 debts: < 200ms
- 100 debts: < 500ms

### Commit Speed
- 10 allocations: < 1 second
- 50 allocations: < 3 seconds
- 100 allocations: < 5 seconds

### UI Responsiveness
- Modal opens: < 200ms
- Preview updates: < 100ms
- Step transitions: < 200ms

---

## Security Tests

### RLS Enforcement
1. Try to call RPC function directly with different user_id
2. Verify function uses auth.uid() and rejects unauthorized access
3. Verify cannot access other users' debts

### Input Validation
1. Try SQL injection in person name
2. Try XSS in notes field
3. Verify all inputs sanitized server-side

### Amount Validation
1. Try negative amount
2. Try zero amount
3. Try amount > outstanding
4. Verify all rejected with clear errors

---

## Test Execution Checklist

### Setup
- [ ] Test data created
- [ ] Migration applied
- [ ] Dev server running
- [ ] Test user authenticated

### Basic Functionality
- [ ] Test Case 1: Basic allocation (exact match)
- [ ] Test Case 2: Partial allocation (oldest first)
- [ ] Test Case 3: Full settlement
- [ ] Test Case 5: Partially paid debt

### Validation
- [ ] Test Case 4: Payment exceeds outstanding (rejected)
- [ ] Test Case 9: Zero amount (rejected)
- [ ] Test Case 10: Negative amount (rejected)
- [ ] Test Case 11: No eligible debts

### Filtering
- [ ] Test Case 6: Direction filtering
- [ ] Test Case 7: Category filtering

### Multi-User
- [ ] Test Case 8: Multi-user isolation

### Edge Cases
- [ ] Test Case 12: Same date, deterministic ordering
- [ ] Test Case 20: Exact remaining balance

### Error Handling
- [ ] Test Case 13: Database failure simulation
- [ ] Test Case 14: Concurrent modifications
- [ ] Test Case 18: Modal close during submission

### Performance
- [ ] Test Case 15: Large number of debts

### Audit & UX
- [ ] Test Case 16: Audit trail verification
- [ ] Test Case 17: Back navigation
- [ ] Test Case 19: Refresh after success

### Regression
- [ ] Individual debt return still works
- [ ] Debt CRUD still works
- [ ] Debt details still works

---

## Success Criteria

All tests pass when:
- ✅ All 20 test cases pass
- ✅ All regression tests pass
- ✅ Performance within targets
- ✅ Security tests pass
- ✅ No console errors
- ✅ No data corruption
- ✅ Audit trail complete
- ✅ User experience smooth

---

## Bug Reporting

If a test fails, report using this template:

```markdown
**Bug ID:** BULK-XXX
**Test Case:** [Test case number and name]
**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Environment:**
- Browser: [Browser name and version]
- OS: [Operating system]
- Screen size: [Dimensions]

**Screenshots/Logs:**
[Attach screenshots or console logs]

**Additional Context:**
[Any other relevant information]
```

---

**Status:** Ready for manual testing
**Estimated Time:** 2-3 hours for complete test execution
