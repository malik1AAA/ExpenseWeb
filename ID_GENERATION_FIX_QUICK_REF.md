# ID Generation Fix - Quick Reference

## 🚨 Problem
```
Failed to save debt: duplicate key value violates unique constraint "debts_user_id_debt_id_key"
```

## 🔍 Root Cause
Migration 004 created **global sequences** but schema requires **per-user unique IDs**.

## ✅ Solution
Migration 006 implements **per-user ID generation** with atomic operations.

---

## 📋 How to Apply (3 Steps)

### Step 1: Diagnose (Optional)
Run: `supabase/diagnostics/check_id_state.sql`

This shows:
- Current IDs in your database
- Any duplicates
- Max ID per user
- Whether migration is needed

### Step 2: Apply Fix
Run: `supabase/migrations/006_fix_per_user_id_generation.sql`

**Via Supabase Dashboard:**
1. SQL Editor → New Query
2. Paste migration 006
3. Click "Run"
4. Verify success messages

### Step 3: Test
```sql
-- Test ID generation (replace with your user_id)
SELECT public.generate_next_debt_id_for_user('YOUR-USER-UUID');
```

Should return: `DEBT_N` (where N is MAX + 1 for your user)

---

## 🎯 What Changed

| Before | After |
|--------|-------|
| Global sequences | Per-user generation |
| User A: DEBT_1, User B: DEBT_2 | User A: DEBT_1, User B: DEBT_1 |
| Potential duplicates | Atomic locking prevents duplicates |
| Inefficient numbering | Efficient per-user numbering |

---

## ✅ Expected Behavior

### Single User
```
Create debt → DEBT_1
Create debt → DEBT_2
Delete DEBT_2
Create debt → DEBT_3 (not DEBT_2!)
```

### Multiple Users
```
User A: DEBT_1, DEBT_2, DEBT_3
User B: DEBT_1, DEBT_2 (independent!)
User C: DEBT_1 (independent!)
```

---

## 🧪 Testing Checklist

- [ ] Create new debt → succeeds
- [ ] Create multiple debts → sequential IDs
- [ ] Create expenses → works correctly
- [ ] Create debt returns → works correctly
- [ ] Edit records → IDs unchanged
- [ ] Delete record → ID not reused
- [ ] Multiple users → each gets own sequence
- [ ] Concurrent creates → no duplicates
- [ ] No more "duplicate key" errors

---

## 📁 Files Created

1. `supabase/migrations/006_fix_per_user_id_generation.sql` - Main fix
2. `supabase/diagnostics/check_id_state.sql` - Diagnostic tool
3. `ID_GENERATION_FIX_REPORT.md` - Full documentation
4. `ID_GENERATION_FIX_QUICK_REF.md` - This file

---

## ⚠️ Important Notes

✅ **Safe:** Preserves all existing data  
✅ **No app changes needed:** Frontend already calls RPC correctly  
✅ **Backward compatible:** Old functions still work  
✅ **Rollback possible:** But not recommended  

❌ **Does NOT:** Renumber existing IDs  
❌ **Does NOT:** Delete any data  
❌ **Does NOT:** Change table schemas  

---

## 🆘 Troubleshooting

### Still getting duplicates?
1. Verify migration 006 was applied
2. Check functions exist:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE 'generate_next_%_for_user';
   ```
3. Test manually:
   ```sql
   SELECT public.generate_next_debt_id_for_user('YOUR-USER-ID');
   ```

### IDs not sequential?
- Gaps are normal (deleted records)
- New IDs always use MAX + 1
- Deleted IDs are not reused (by design)

---

## 📊 Migration Safety

**Risk Level:** Low  
**Data Impact:** None (preserves all data)  
**Downtime:** None (online migration)  
**Rollback:** Possible but not needed  

---

## 🚀 Next Steps

1. Apply migration 006
2. Test creating records
3. Verify no duplicate errors
4. Monitor for any issues

---

**Status:** ✅ Ready to Apply  
**Build:** ✅ No app changes needed  
**Documentation:** ✅ Complete
