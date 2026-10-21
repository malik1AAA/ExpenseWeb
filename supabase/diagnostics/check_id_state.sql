-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check Current ID State
-- ============================================================================
-- Run this script in Supabase SQL Editor to diagnose ID issues
-- ============================================================================

-- 1. Check existing debts and their IDs
SELECT 
  user_id,
  debt_id,
  person,
  direction,
  original_amount,
  date,
  created_at
FROM public.debts
ORDER BY user_id, debt_id;

-- 2. Check existing expenses and their IDs
SELECT 
  user_id,
  expense_id,
  description,
  category,
  amount,
  date,
  created_at
FROM public.expenses
ORDER BY user_id, expense_id;

-- 3. Check existing debt returns and their IDs
SELECT 
  user_id,
  return_id,
  debt_id,
  amount,
  date,
  created_at
FROM public.debt_returns
ORDER BY user_id, return_id;

-- 4. Check for duplicate debt IDs per user
SELECT 
  user_id,
  debt_id,
  COUNT(*) as count
FROM public.debts
GROUP BY user_id, debt_id
HAVING COUNT(*) > 1;

-- 5. Check for duplicate expense IDs per user
SELECT 
  user_id,
  expense_id,
  COUNT(*) as count
FROM public.expenses
GROUP BY user_id, expense_id
HAVING COUNT(*) > 1;

-- 6. Check for duplicate return IDs per user
SELECT 
  user_id,
  return_id,
  COUNT(*) as count
FROM public.debt_returns
GROUP BY user_id, return_id
HAVING COUNT(*) > 1;

-- 7. Find the maximum ID number per user for debts
SELECT 
  user_id,
  MAX(
    CASE 
      WHEN debt_id ~ '^DEBT_[0-9]+$' 
      THEN CAST(SUBSTRING(debt_id FROM 6) AS BIGINT)
      ELSE 0
    END
  ) as max_debt_num
FROM public.debts
GROUP BY user_id;

-- 8. Find the maximum ID number per user for expenses
SELECT 
  user_id,
  MAX(
    CASE 
      WHEN expense_id ~ '^EXPENSE_[0-9]+$' 
      THEN CAST(SUBSTRING(expense_id FROM 9) AS BIGINT)
      ELSE 0
    END
  ) as max_expense_num
FROM public.expenses
GROUP BY user_id;

-- 9. Find the maximum ID number per user for returns
SELECT 
  user_id,
  MAX(
    CASE 
      WHEN return_id ~ '^RETURN_[0-9]+$' 
      THEN CAST(SUBSTRING(return_id FROM 8) AS BIGINT)
      ELSE 0
    END
  ) as max_return_num
FROM public.debt_returns
GROUP BY user_id;

-- 10. Test the new ID generation function (replace with your user_id)
-- SELECT public.generate_next_debt_id_for_user('YOUR-USER-UUID-HERE');
-- SELECT public.generate_next_expense_id_for_user('YOUR-USER-UUID-HERE');
-- SELECT public.generate_next_return_id_for_user('YOUR-USER-UUID-HERE');

-- 11. Check if old global sequences still exist
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
  AND sequence_name LIKE '%_seq_global';

-- 12. Check if new per-user functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE 'generate_next_%_for_user';
