# Bulk Repayment Feature - Quick Reference

## What It Does

Allows recording a single payment that automatically allocates across multiple outstanding debts for the same person, direction, and category. Oldest debts are paid first.

## Quick Start

1. **Apply Migration**
   ```sql
   -- In Supabase SQL Editor, run:
   -- supabase/migrations/003_bulk_repayment_rpc.sql
   ```

2. **Use the Feature**
   - Go to Debts page
   - Click "Record Bulk Repayment" button
   - Select person, direction, category
   - Enter amount, date, notes
   - Review preview
   - Confirm & save

## Example

**Ahmed owes you:**
- Debt 1 (Jan 1): Rs. 125
- Debt 2 (Jan 5): Rs. 150
- **Total: Rs. 275**

**You receive Rs. 250 from Ahmed:**
- Debt 1: Rs. 125 allocated → Remaining: Rs. 0 ✓
- Debt 2: Rs. 125 allocated → Remaining: Rs. 25

**Result:** 2 debt_returns records created automatically

## Key Features

✅ **Automatic Allocation** - Oldest debts paid first  
✅ **Live Preview** - See allocation before saving  
✅ **Atomic Transactions** - All-or-nothing via RPC  
✅ **Audit Trail** - Shared notes link related returns  
✅ **Validation** - Client + server-side checks  
✅ **Multi-User Safe** - RLS enforced  

## Files Created

```
supabase/migrations/003_bulk_repayment_rpc.sql  - Database function
src/services/bulkRepaymentService.js            - Client service
src/components/debts/BulkRepaymentModal.jsx     - UI component
BULK_REPAYMENT_FEATURE.md                       - Full documentation
BULK_REPAYMENT_TESTING_GUIDE.md                 - Testing guide
BULK_REPAYMENT_QUICK_REFERENCE.md               - This file
```

## Files Modified

```
src/components/debts/index.js    - Added export
src/pages/Debts.jsx              - Added button + modal
```

## Allocation Rules

1. Filter debts by person + direction + category
2. Exclude debts with remaining ≤ 0
3. Sort by date ASC, debt_id ASC (tie-breaker)
4. Allocate oldest-first
5. Never exceed debt's remaining balance
6. Stop when payment exhausted or all debts settled

## Validation

| Rule | Client | Server |
|------|--------|--------|
| Amount > 0 | ✅ | ✅ |
| Amount ≤ outstanding | ✅ | ✅ |
| Person required | ✅ | ✅ |
| Direction valid | ✅ | ✅ |
| Category valid | ✅ | ✅ |
| Date required | ✅ | ✅ |
| Eligible debts exist | ✅ | ✅ |

## Error Messages

- "Payment amount must be greater than zero"
- "Payment amount (X) exceeds total outstanding (Y)"
- "No outstanding debts found for this person, direction, and category"
- "Not authenticated"
- "Person is required"
- "Direction must be Lent or Borrowed"
- "Debt category must be Food or Cash"
- "Date is required"

## UI Flow

```
Step 1: Select
  ├─ Person dropdown
  ├─ Direction dropdown (Lent/Borrowed)
  ├─ Category dropdown (Food/Cash)
  ├─ Shows eligible debts count
  ├─ Shows total outstanding
  └─ [Next →]

Step 2: Preview
  ├─ Amount input
  ├─ Date input
  ├─ Notes input
  ├─ Live allocation preview
  ├─ Shows each debt's allocation
  ├─ Shows remaining before/after
  └─ [Confirm & Save]

Step 3: Success
  ├─ Success message
  ├─ Allocation summary
  └─ [Close]
```

## Database Function

```sql
SELECT public.bulk_repay_person(
  'Ahmed',           -- person
  'Lent',            -- direction
  'Food',            -- debt_category
  250.00,            -- total_amount
  '2026-01-29',      -- date
  'Bulk payment'     -- notes
);
```

**Returns:**
```json
{
  "success": true,
  "allocations_count": 2,
  "total_paid": 250.00,
  "allocations": [
    {"debt_id": "DEBT_1", "allocated": 125.00, ...},
    {"debt_id": "DEBT_2", "allocated": 125.00, ...}
  ]
}
```

## Testing Quick Checklist

- [ ] Basic allocation works
- [ ] Partial allocation works
- [ ] Full settlement works
- [ ] Exceeds outstanding rejected
- [ ] Zero/negative rejected
- [ ] Direction filtering works
- [ ] Category filtering works
- [ ] Multi-user isolation works
- [ ] Audit trail complete
- [ ] Individual returns still work

## Troubleshooting

**Issue:** "Not authenticated"  
**Fix:** Ensure user is logged in

**Issue:** "No outstanding debts found"  
**Fix:** Check person/direction/category match existing debts

**Issue:** "Payment amount exceeds total outstanding"  
**Fix:** Reduce amount to ≤ outstanding shown

**Issue:** RPC function not found  
**Fix:** Apply migration `003_bulk_repayment_rpc.sql`

**Issue:** Allocation doesn't match preview  
**Fix:** Debt was modified between preview and commit. Refresh and retry.

## Performance

- **Preview:** < 100ms for < 50 debts
- **Commit:** < 3 seconds for < 50 allocations
- **UI:** Responsive, no freezing

## Security

- ✅ RLS enforced (auth.uid() check)
- ✅ Input validation (client + server)
- ✅ Atomic transactions (no partial commits)
- ✅ No SQL injection (parameterized queries)
- ✅ User isolation (cannot access others' data)

## Status

**Implementation:** ✅ Complete  
**Build:** ✅ Successful  
**Documentation:** ✅ Complete  
**Ready for:** Testing & Production

---

**For detailed info:** See `BULK_REPAYMENT_FEATURE.md`  
**For testing:** See `BULK_REPAYMENT_TESTING_GUIDE.md`
