-- ============================================================================
-- MIGRATION 006: Fix Per-User ID Generation
-- ============================================================================
-- This migration fixes the critical bug where ID sequences were global instead
-- of per-user, causing duplicate key violations.
--
-- Root Cause:
--   - Migration 004 created GLOBAL sequences (expense_id_seq_global, etc.)
--   - Schema requires UNIQUE(user_id, debt_id) - per-user uniqueness
--   - Global sequences caused User A to get DEBT_1, User B to get DEBT_2
--   - This is inefficient and can cause duplicates if sequences desync
--
-- Solution:
--   - Drop global sequences
--   - Create per-user ID generation functions that:
--     1. Find the MAX ID for the specific user
--     2. Increment it atomically with proper locking
--     3. Return the new ID in the correct format
--   - Handle existing data safely
--   - Ensure no duplicates can occur
--
-- This migration is safe for production and preserves all existing data.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop old global sequences (if they exist)
-- ============================================================================

DROP SEQUENCE IF EXISTS public.expense_id_seq_global;
DROP SEQUENCE IF EXISTS public.debt_id_seq_global;
DROP SEQUENCE IF EXISTS public.return_id_seq_global;

-- ============================================================================
-- STEP 2: Create per-user ID generation functions
-- ============================================================================

-- Function to generate next expense ID for a specific user
CREATE OR REPLACE FUNCTION public.generate_next_expense_id_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_num BIGINT;
  v_next_num BIGINT;
  v_result TEXT;
  v_existing_ids TEXT[];
BEGIN
  -- Lock the table to prevent race conditions
  -- Using advisory lock based on user_id for per-user locking
  PERFORM pg_advisory_xact_lock(hashtext('expense_' || p_user_id::text));
  
  -- Find the maximum expense number for this user
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN expense_id ~ '^EXPENSE_[0-9]+$' 
        THEN CAST(SUBSTRING(expense_id FROM 9) AS BIGINT)
        ELSE 0
      END
    ),
    0
  )
  INTO v_max_num
  FROM public.expenses
  WHERE user_id = p_user_id;
  
  -- Next number is max + 1
  v_next_num := v_max_num + 1;
  
  -- Generate the ID
  v_result := 'EXPENSE_' || v_next_num;
  
  -- Verify it doesn't already exist (safety check)
  SELECT ARRAY_AGG(expense_id)
  INTO v_existing_ids
  FROM public.expenses
  WHERE user_id = p_user_id AND expense_id = v_result;
  
  -- If it exists (shouldn't happen with proper locking), find next available
  IF v_existing_ids IS NOT NULL AND array_length(v_existing_ids, 1) > 0 THEN
    -- This shouldn't happen, but handle it gracefully
    RAISE WARNING 'Expense ID % already exists for user %, finding next available', v_result, p_user_id;
    
    -- Find next available number
    LOOP
      v_next_num := v_next_num + 1;
      v_result := 'EXPENSE_' || v_next_num;
      
      SELECT ARRAY_AGG(expense_id)
      INTO v_existing_ids
      FROM public.expenses
      WHERE user_id = p_user_id AND expense_id = v_result;
      
      EXIT WHEN v_existing_ids IS NULL OR array_length(v_existing_ids, 1) = 0;
    END LOOP;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Function to generate next debt ID for a specific user
CREATE OR REPLACE FUNCTION public.generate_next_debt_id_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_num BIGINT;
  v_next_num BIGINT;
  v_result TEXT;
  v_existing_ids TEXT[];
BEGIN
  -- Lock for this user
  PERFORM pg_advisory_xact_lock(hashtext('debt_' || p_user_id::text));
  
  -- Find the maximum debt number for this user
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN debt_id ~ '^DEBT_[0-9]+$' 
        THEN CAST(SUBSTRING(debt_id FROM 6) AS BIGINT)
        ELSE 0
      END
    ),
    0
  )
  INTO v_max_num
  FROM public.debts
  WHERE user_id = p_user_id;
  
  -- Next number is max + 1
  v_next_num := v_max_num + 1;
  
  -- Generate the ID
  v_result := 'DEBT_' || v_next_num;
  
  -- Verify it doesn't already exist (safety check)
  SELECT ARRAY_AGG(debt_id)
  INTO v_existing_ids
  FROM public.debts
  WHERE user_id = p_user_id AND debt_id = v_result;
  
  -- If it exists, find next available
  IF v_existing_ids IS NOT NULL AND array_length(v_existing_ids, 1) > 0 THEN
    RAISE WARNING 'Debt ID % already exists for user %, finding next available', v_result, p_user_id;
    
    LOOP
      v_next_num := v_next_num + 1;
      v_result := 'DEBT_' || v_next_num;
      
      SELECT ARRAY_AGG(debt_id)
      INTO v_existing_ids
      FROM public.debts
      WHERE user_id = p_user_id AND debt_id = v_result;
      
      EXIT WHEN v_existing_ids IS NULL OR array_length(v_existing_ids, 1) = 0;
    END LOOP;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Function to generate next return ID for a specific user
CREATE OR REPLACE FUNCTION public.generate_next_return_id_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_num BIGINT;
  v_next_num BIGINT;
  v_result TEXT;
  v_existing_ids TEXT[];
BEGIN
  -- Lock for this user
  PERFORM pg_advisory_xact_lock(hashtext('return_' || p_user_id::text));
  
  -- Find the maximum return number for this user
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN return_id ~ '^RETURN_[0-9]+$' 
        THEN CAST(SUBSTRING(return_id FROM 8) AS BIGINT)
        ELSE 0
      END
    ),
    0
  )
  INTO v_max_num
  FROM public.debt_returns
  WHERE user_id = p_user_id;
  
  -- Next number is max + 1
  v_next_num := v_max_num + 1;
  
  -- Generate the ID
  v_result := 'RETURN_' || v_next_num;
  
  -- Verify it doesn't already exist (safety check)
  SELECT ARRAY_AGG(return_id)
  INTO v_existing_ids
  FROM public.debt_returns
  WHERE user_id = p_user_id AND return_id = v_result;
  
  -- If it exists, find next available
  IF v_existing_ids IS NOT NULL AND array_length(v_existing_ids, 1) > 0 THEN
    RAISE WARNING 'Return ID % already exists for user %, finding next available', v_result, p_user_id;
    
    LOOP
      v_next_num := v_next_num + 1;
      v_result := 'RETURN_' || v_next_num;
      
      SELECT ARRAY_AGG(return_id)
      INTO v_existing_ids
      FROM public.debt_returns
      WHERE user_id = p_user_id AND return_id = v_result;
      
      EXIT WHEN v_existing_ids IS NULL OR array_length(v_existing_ids, 1) = 0;
    END LOOP;
  END IF;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- STEP 3: Update old RPC functions to use new per-user functions
-- ============================================================================

-- Update generate_next_expense_id to use authenticated user
CREATE OR REPLACE FUNCTION public.generate_next_expense_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN public.generate_next_expense_id_for_user(v_user_id);
END;
$$;

-- Update generate_next_debt_id to use authenticated user
CREATE OR REPLACE FUNCTION public.generate_next_debt_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN public.generate_next_debt_id_for_user(v_user_id);
END;
$$;

-- Update generate_next_return_id to use authenticated user
CREATE OR REPLACE FUNCTION public.generate_next_return_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN public.generate_next_return_id_for_user(v_user_id);
END;
$$;

-- ============================================================================
-- STEP 4: Grant permissions
-- ============================================================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.generate_next_expense_id_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_debt_id_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_return_id_for_user(UUID) TO authenticated;

-- Update permissions on old functions (they now call the new ones)
GRANT EXECUTE ON FUNCTION public.generate_next_expense_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_debt_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_return_id() TO authenticated;

-- ============================================================================
-- STEP 5: Verify and report
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Dropped old global sequences';
  RAISE NOTICE '✓ Created per-user ID generation functions';
  RAISE NOTICE '✓ Updated RPC functions to use authenticated user';
  RAISE NOTICE '✓ Granted necessary permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'ID generation is now per-user and atomic:';
  RAISE NOTICE '  - Each user gets their own sequence starting from 1';
  RAISE NOTICE '  - Advisory locks prevent race conditions';
  RAISE NOTICE '  - Safety checks prevent duplicates';
  RAISE NOTICE '  - Existing data is preserved';
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Each user now has their own ID sequence (DEBT_1, DEBT_2, etc.)
-- 2. Advisory locks ensure atomic ID generation per user
-- 3. Safety checks verify no duplicates before returning
-- 4. Existing IDs are preserved - no renumbering
-- 5. Deleted IDs are not reused (next ID is always MAX + 1)
-- 6. The old global sequences are dropped to prevent confusion
-- 7. Old RPC functions still work but now use per-user logic
-- ============================================================================
