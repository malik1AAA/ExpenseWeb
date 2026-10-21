# 🚨 Action Required: Fix Duplicate ID Bug

## Quick Summary

**Problem:** You're getting "duplicate key value violates unique constraint" errors when creating debts/expenses/returns.

**Root Cause:** Database is using global ID sequences instead of per-user sequences.

**Solution:** Apply migration 006 to fix ID generation.

**Time Required:** 5 minutes

**Risk Level:** Low (no data changes)

---

## 📋 Step-by-Step Action Plan

### Step 1: Read the Documentation (2 minutes)

Read these files in order:

1. **`ID_GENERATION_FIX_SUMMARY.md`** - Executive summary (you're reading a version of this)
2. **`ID_GENERATION_FIX_REPORT.md`** - Technical details (if you want to understand the fix)
3. **`ID_GENERATION_FIX_QUICK_REF.md`** - Quick reference for testing

### Step 2: Diagnose Current State (Optional, 1 minute)

**File:** `supabase/diagnostics/check_id_state.sql`

**What to do:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `check_id_state.sql`
3. Paste and click "Run"
4. Review the output

**What you'll see:**
- List of all your debts/expenses/returns with IDs
- Any duplicate IDs (hopefully none)
- Maximum ID number per user
- Whether old sequences exist
- Whether new functions exist

**If you see duplicates:** Don't panic, the fix will prevent future duplicates.

### Step 3: Apply the Fix (1 minute)

**File:** `supabase/migrations/006_fix_per_user_id_generation.sql`

**What to do:**
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy **entire** contents of `006_fix_per_user_id_generation.sql`
4. Paste into editor
5. Click "Run"
6. Wait for completion (~5 seconds)

**Expected output:**
```
NOTICE:  ✓ Dropped old global sequences
NOTICE:  ✓ Created per-user ID generation functions
NOTICE:  ✓ Updated RPC functions to use authenticated user
NOTICE:  ✓ Granted necessary permissions
NOTICE:  
NOTICE:  ID generation is now per-user and atomic:
NOTICE:    - Each user gets their own sequence starting from 1
NOTICE:    - Advisory locks prevent race conditions
NOTICE:    - Safety checks prevent duplicates
NOTICE:    - Existing data is preserved
```

**If you see errors:** Check the Troubleshooting section below.

### Step 4: Verify the Fix (1 minute)

**Test in SQL Editor:**
```sql
-- Replace with your actual user_id from Settings → Profile
-- You can find it in Supabase Dashboard → Authentication → Users
SELECT public.generate_next_debt_id_for_user('YOUR-USER-UUID-HERE');
```

**Expected result:** Should return `DEBT_N` where N is your current max + 1

**Test in Application:**
1. Open your app
2. Go to Debts page
3. Click "Add Debt"
4. Fill form and save
5. ✅ Should succeed without error
6. ✅ Should get sequential ID

### Step 5: Run Comprehensive Tests (5 minutes)

Use the testing checklist from `ID_GENERATION_FIX_SUMMARY.md`:

**Critical Tests:**
- [ ] Create new debt → succeeds
- [ ] Create multiple debts → sequential IDs
- [ ] Create expenses → works
- [ ] Create debt returns → works
- [ ] No duplicate key errors
- [ ] Each user gets own sequence

**If all tests pass:** ✅ Fix is successful!

---

## 🆘 Troubleshooting

### Issue: Migration fails with "sequence does not exist"

**Cause:** Old sequences already dropped (migration was partially applied)

**Solution:** Safe to ignore, migration is idempotent. Continue with testing.

### Issue: Migration fails with "function already exists"

**Cause:** Migration already applied

**Solution:** Safe to ignore, functions are recreated. Continue with testing.

### Issue: Still getting duplicate key errors after migration

**Diagnosis:**
```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE 'generate_next_%_for_user';
```

**Expected:** Should see 3 functions

**If missing:** Reapply migration 006

**If present:** Check application is calling correct RPC function

### Issue: Test query returns NULL

**Diagnosis:**
```sql
-- Check if you're authenticated
SELECT auth.uid();
```

**Expected:** Should return your user UUID

**If NULL:** You need to be logged in to Supabase Dashboard

**Solution:** Use the SQL Editor while logged in (it runs as authenticated user)

---

## 📊 What Changed

### Before Fix
```
Global Sequence: debt_id_seq_global
User A creates debt → DEBT_1
User B creates debt → DEBT_2  ❌ Wrong!
User C creates debt → DEBT_3  ❌ Wrong!
```

### After Fix
```
Per-User Generation:
User A creates debt → DEBT_1  ✅
User B creates debt → DEBT_1  ✅ (independent!)
User C creates debt → DEBT_1  ✅ (independent!)
```

---

## ✅ Success Criteria

The fix is successful when:

- ✅ You can create debts without errors
- ✅ You can create expenses without errors
- ✅ You can create debt returns without errors
- ✅ Each user gets independent sequential IDs
- ✅ No duplicate key errors occur
- ✅ Existing data is unchanged

---

## 📁 Files You Need

### Must Apply
1. **`supabase/migrations/006_fix_per_user_id_generation.sql`** - The fix

### Recommended
2. **`supabase/diagnostics/check_id_state.sql`** - Diagnostic tool

### Documentation
3. **`ID_GENERATION_FIX_SUMMARY.md`** - Complete guide
4. **`ID_GENERATION_FIX_REPORT.md`** - Technical details
5. **`ID_GENERATION_FIX_QUICK_REF.md`** - Quick reference
6. **`ACTION_REQUIRED_FIX_DUPLICATE_ID_BUG.md`** - This file

---

## 🎯 Quick Action Checklist

- [ ] Read this document
- [ ] (Optional) Run diagnostic script
- [ ] Apply migration 006
- [ ] Verify success messages
- [ ] Test ID generation in SQL
- [ ] Test creating debt in app
- [ ] Test creating expense in app
- [ ] Test creating debt return in app
- [ ] Verify no duplicate errors
- [ ] Test with multiple users (if applicable)

**If all checkboxes are checked:** ✅ Fix is complete!

---

## 📞 Need Help?

### Check These First
1. **Migration applied?** Run the diagnostic query
2. **Functions exist?** Check `information_schema.routines`
3. **Permissions granted?** Verify EXECUTE privilege
4. **Testing correctly?** Use authenticated SQL Editor

### Common Issues
- **"duplicate key" error** → Migration not applied or not working
- **IDs not sequential** → Normal if records were deleted
- **Function returns NULL** → Not authenticated in SQL Editor
- **Migration fails** → Check error message, usually safe to ignore

---

## 🚀 Ready to Apply?

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy `supabase/migrations/006_fix_per_user_id_generation.sql`
4. Paste and click "Run"
5. Test creating a debt
6. ✅ Done!

---

## 📝 Summary

**Problem:** Duplicate ID generation causing constraint violations  
**Solution:** Per-user ID generation with atomic operations  
**Migration:** 006_fix_per_user_id_generation.sql  
**Time:** 5 minutes  
**Risk:** Low  
**Data Impact:** None  
**App Changes:** None required  

**Status:** ✅ Ready to apply

---

**Apply migration 006 now to fix the duplicate ID bug!**
