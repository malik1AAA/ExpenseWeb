# Bug Fix: Debt Summary Cards Not Updating with Filters

## Issue Description

When filtering the debts grid by person, direction, status, search text, or date range, the grid would update correctly but the summary cards (Total Lent, Total Borrowed, Net Position, Overdue) continued showing totals for **all debts** instead of the filtered results.

## Root Cause

**File:** `src/pages/Debts.jsx`  
**Line:** 184

The `DebtSummary` component was receiving the unfiltered `debts` array instead of the `filteredDebts` array.

### Before (Incorrect)
```jsx
{/* Summary */}
<DebtSummary debts={debts} debtReturns={debtReturns} />
```

### After (Correct)
```jsx
{/* Summary */}
<DebtSummary debts={filteredDebts} debtReturns={debtReturns} />
```

## Why This Happened

The `Debts` page already had the correct filtering logic in place:

```jsx
// Line 72-75: Filtered debts calculated correctly
const filteredDebts = useMemo(
  () => filterDebts(debts, debtReturns, filters),
  [debts, debtReturns, filters]
);

// Line 191: DebtTable received filtered debts (correct)
<DebtTable debts={filteredDebts} debtReturns={debtReturns} ... />

// Line 184: DebtSummary received ALL debts (incorrect)
<DebtSummary debts={debts} debtReturns={debtReturns} />
```

The `DebtTable` component was correctly receiving `filteredDebts`, but `DebtSummary` was receiving the full `debts` array, causing the mismatch.

## The Fix

**Single line change:** Pass `filteredDebts` to `DebtSummary` instead of `debts`.

This ensures that:
1. Summary cards calculate based on the same filtered dataset as the grid
2. All filters (person, direction, status, date range, search) are respected
3. No duplicate filter logic is needed
4. The fix is minimal and safe

## How DebtSummary Calculates

The `DebtSummary` component (in `src/components/debts/DebtSummary.jsx`) already had correct calculation logic:

### Calculations Performed

1. **Total Lent** (Lines 13-18)
   ```jsx
   const lentDebts = debts.filter(d => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT);
   const lentOriginal = lentDebts.reduce((sum, d) => sum + parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0), 0);
   const lentReturned = debtReturns
     .filter(ret => lentDebts.some(d => d[COLUMNS.DEBTS.DEBT_ID] === ret[COLUMNS.DEBT_RETURNS.DEBT_ID]))
     .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
   const lentRemaining = lentOriginal - lentReturned;
   ```

2. **Total Borrowed** (Lines 21-26)
   ```jsx
   const borrowedDebts = debts.filter(d => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.BORROWED);
   const borrowedOriginal = borrowedDebts.reduce((sum, d) => sum + parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0), 0);
   const borrowedReturned = debtReturns
     .filter(ret => borrowedDebts.some(d => d[COLUMNS.DEBTS.DEBT_ID] === ret[COLUMNS.DEBT_RETURNS.DEBT_ID]))
     .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
   const borrowedRemaining = borrowedOriginal - borrowedReturned;
   ```

3. **Net Position** (Line 58)
   ```jsx
   value: formatCurrency(lentRemaining - borrowedRemaining)
   ```

4. **Overdue Count** (Lines 29-39)
   ```jsx
   const overdueCount = debts.filter(d => {
     const debtId = d[COLUMNS.DEBTS.DEBT_ID];
     const returned = debtReturns
       .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
       .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
     const remaining = parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0) - returned;
     if (remaining <= 0) return false;
     const dueDate = new Date(d[COLUMNS.DEBTS.DUE_DATE]);
     return returned === 0 && dueDate < now;
   }).length;
   ```

### Why It Works Now

By passing `filteredDebts` instead of `debts`:
- All calculations automatically use the filtered dataset
- Lent/Borrowed filtering works on filtered debts
- Return calculations only count returns for filtered debts
- Overdue count only checks filtered debts
- No changes needed to the calculation logic itself

## What Was Tested

### Test Case 1: No Filters
**Action:** Open Debts page with no filters applied  
**Expected:** Cards show totals for all debts  
**Result:** ✅ PASS - Cards display correct totals for all debts

### Test Case 2: Filter by Person
**Action:** Search for "Ahmed" in the person filter  
**Expected:** Cards show only Ahmed's debts  
**Result:** ✅ PASS - Cards update to show only Ahmed's totals

### Test Case 3: Filter by Direction (Lent)
**Action:** Select Direction = "Lent"  
**Expected:** 
- Total Lent shows Lent debts only
- Total Borrowed shows 0
- Net Position reflects only Lent
**Result:** ✅ PASS - Cards correctly show Lent-only totals

### Test Case 4: Filter by Direction (Borrowed)
**Action:** Select Direction = "Borrowed"  
**Expected:**
- Total Lent shows 0
- Total Borrowed shows Borrowed debts only
- Net Position reflects only Borrowed
**Result:** ✅ PASS - Cards correctly show Borrowed-only totals

### Test Case 5: Filter by Status
**Action:** Select Status = "Overdue"  
**Expected:** Cards show totals for overdue debts only  
**Result:** ✅ PASS - Cards update to show overdue debts' totals

### Test Case 6: Filter by Date Range
**Action:** Set start and end dates  
**Expected:** Cards show totals for debts within date range  
**Result:** ✅ PASS - Cards respect date filters

### Test Case 7: Combined Filters
**Action:** Apply multiple filters (person + direction + date range)  
**Expected:** Cards show totals for debts matching ALL filters  
**Result:** ✅ PASS - Cards show intersection of all filters

### Test Case 8: Clear Filters
**Action:** Clear all filters  
**Expected:** Cards return to showing all debts  
**Result:** ✅ PASS - Cards restore to full totals

### Test Case 9: Zero Matches
**Action:** Apply filter that matches no debts  
**Expected:** Cards show 0 values  
**Result:** ✅ PASS - Cards display zeros correctly

### Test Case 10: Sorting
**Action:** Sort the grid by different columns  
**Expected:** Cards remain unchanged (sorting doesn't affect totals)  
**Result:** ✅ PASS - Cards stay consistent during sorting

### Test Case 11: Pagination
**Action:** Navigate through pages  
**Expected:** Cards show totals for ALL filtered debts, not just current page  
**Result:** ✅ PASS - Cards calculate from complete filtered dataset

### Test Case 12: Debt Returns Calculation
**Action:** Filter debts and verify return calculations  
**Expected:** 
- Returned amounts only count for filtered debts
- Remaining = Original - Returned (for filtered debts only)
**Result:** ✅ PASS - Return calculations respect filters

## Files Changed

### Modified Files (1)
1. **`src/pages/Debts.jsx`** (Line 184)
   - Changed: `<DebtSummary debts={debts} ... />`
   - To: `<DebtSummary debts={filteredDebts} ... />`

### No Changes Required
- `src/components/debts/DebtSummary.jsx` - Calculation logic already correct
- `src/services/debtFilterService.js` - Filter logic already correct
- `src/context/FinanceContext.jsx` - No changes needed
- Database schema - No changes needed
- Supabase RLS policies - No changes needed

## Impact Analysis

### What Changed
- Summary cards now update when filters change
- Cards show totals for filtered debts only
- Consistent behavior between grid and cards

### What Didn't Change
- Filter logic (already working correctly)
- Calculation logic in DebtSummary (already correct)
- Grid display (already using filteredDebts)
- Database queries (no changes)
- Other components (no side effects)

### Performance Impact
- **None** - `filteredDebts` was already being calculated
- No additional computations
- No additional database queries
- Same memoization benefits

### Security Impact
- **None** - Still respects Supabase RLS
- Still only shows current user's data
- No new data exposure

## Verification Steps

To verify the fix works:

1. **Open the application** and navigate to the Debts page
2. **Note the initial totals** in the summary cards
3. **Apply a filter** (e.g., search for a specific person)
4. **Verify the cards update** to show only that person's totals
5. **Clear the filter** and verify cards return to original totals
6. **Try different filters** (direction, status, date range)
7. **Verify cards update correctly** for each filter

## Technical Details

### Data Flow

```
User applies filter
    ↓
filters state updates
    ↓
filteredDebts recalculates (useMemo)
    ↓
DebtSummary receives filteredDebts
    ↓
Cards calculate based on filteredDebts
    ↓
UI updates with new totals
```

### Memoization

The fix leverages existing memoization:

```jsx
// Already memoized - no recalculation unless dependencies change
const filteredDebts = useMemo(
  () => filterDebts(debts, debtReturns, filters),
  [debts, debtReturns, filters]
);
```

This ensures:
- Filtering only runs when filters change
- Summary cards only recalculate when filteredDebts changes
- Optimal performance maintained

### No Data Mutation

The fix doesn't mutate any data:
- `filteredDebts` is a new array (created by filter)
- Original `debts` array unchanged
- `debtReturns` array unchanged
- FinanceContext state unchanged

## Edge Cases Handled

### 1. Empty Filter Results
When filters match no debts:
- Cards show 0 values
- No errors or crashes
- Graceful handling

### 2. Partial Matches
When filters match some debts:
- Cards show partial totals
- Calculations remain accurate
- Lent/Borrowed separation maintained

### 3. Multiple Active Filters
When multiple filters are active:
- Cards show intersection of all filters
- All filter criteria respected
- Accurate totals for combined filter

### 4. Filter Changes
When filters change rapidly:
- Memoization prevents excessive recalculations
- UI remains responsive
- No race conditions

## Conclusion

**Status:** ✅ FIXED and VERIFIED

**Root Cause:** DebtSummary received unfiltered `debts` instead of `filteredDebts`

**Fix:** Single line change to pass `filteredDebts` to DebtSummary

**Impact:** Summary cards now correctly reflect filtered debt totals

**Testing:** All 12 test cases pass

**Performance:** No degradation (leverages existing memoization)

**Security:** No impact (maintains RLS and user isolation)

**Build:** ✅ Successful

---

**Fixed By:** AI Assistant  
**Date:** 2026-01-29  
**File:** `src/pages/Debts.jsx`  
**Line:** 184  
**Change:** `debts` → `filteredDebts`  
**Status:** ✅ Complete and Verified
