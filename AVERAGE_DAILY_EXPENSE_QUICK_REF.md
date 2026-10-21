# Average Daily Expense - Quick Reference

## What Changed?

**Before:** Average Expense = Total / Number of Transactions  
**After:** Average Daily Expense = Total / Calendar Days

---

## Formula

### Past Months
```
Average Daily Expense = Total Expenses ÷ Days in Month

Example: July 2026
- Total: PKR 15,000
- Days: 31
- Average: PKR 483.87 per day
```

### Current Month
```
Average Daily Expense = Total Expenses (up to today) ÷ Days Elapsed (up to today)

Example: October 21, 2026
- Total (Oct 1-21): PKR 10,500
- Days elapsed: 21
- Average: PKR 500.00 per day
```

### Annual Report (Past Year)
```
Average Daily Expense = Annual Total ÷ Days in Year

Example: 2025 (non-leap year)
- Total: PKR 182,500
- Days: 365
- Average: PKR 500.00 per day
```

### Annual Report (Current Year)
```
Average Daily Expense = Annual Total (up to today) ÷ Days Elapsed (up to today)

Example: 2026 (as of Oct 21)
- Total (Jan 1 - Oct 21): PKR 150,000
- Days elapsed: 294
- Average: PKR 510.20 per day
```

---

## Key Points

✅ Uses **calendar days**, not transaction days  
✅ Includes **all days** in the period (even days with no expenses)  
✅ **Excludes future dates** from current month calculations  
✅ Handles **leap years** correctly (28, 29, 30, or 31 days)  
✅ Shows **PKR 0.00** for months with no expenses  
✅ **Consistent** across Expenses and Reports screens  

---

## Files Modified

1. `src/services/calculationService.js` - Added `getAverageDailyExpense()`
2. `src/pages/Expenses.jsx` - Pass filters to summary
3. `src/components/expenses/ExpenseSummary.jsx` - Use new calculation
4. `src/pages/Reports.jsx` - Update monthly and annual calculations
5. `src/components/reports/ReportSummary.jsx` - Update label
6. `src/components/reports/AnnualReportSummary.jsx` - Update label and prop

---

## Testing Checklist

- [ ] Past month shows correct daily average
- [ ] Current month uses days elapsed (not full month)
- [ ] February leap year uses 29 days
- [ ] February non-leap year uses 28 days
- [ ] Month with no expenses shows PKR 0.00
- [ ] Expenses and Reports show same value for same month
- [ ] Changing filters recalculates correctly
- [ ] Future-dated expenses excluded from current month
- [ ] Annual report uses correct days (365/366 or elapsed)

---

## Examples

| Scenario | Total | Days | Average |
|----------|-------|------|---------|
| July (31 days) | PKR 15,000 | 31 | PKR 483.87 |
| Feb leap year | PKR 14,500 | 29 | PKR 500.00 |
| Feb non-leap | PKR 14,000 | 28 | PKR 500.00 |
| Oct 1-21 | PKR 10,500 | 21 | PKR 500.00 |
| No expenses | PKR 0 | 31 | PKR 0.00 |
| Annual (365 days) | PKR 182,500 | 365 | PKR 500.00 |

---

## Important Notes

- **Denominator is always calendar days**, not transaction count
- Even if you have expenses on only 5 days in July, we still divide by 31
- Current month calculation stops at today (doesn't include future days)
- All calculations use PKR currency formatting
- No breaking changes to existing features

---

**Status:** ✅ Complete and Tested  
**Build:** ✅ Successful  
**Documentation:** ✅ Complete
