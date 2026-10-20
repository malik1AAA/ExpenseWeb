-- ============================================================================
-- MIGRATION: Add Readable Sequential IDs
-- ============================================================================
-- This migration adds human-readable sequential IDs for expenses, debts, and
-- debt returns. The IDs are generated atomically in the database to prevent
-- duplicates in concurrent scenarios.
--
-- Changes:
--   1. Create per-user sequences for ID generation
--   2. Create function to generate next ID atomically
--   3. Backfill existing records with new format
--   4. Update ID format: EXP_ -> EXPENSE_, RET_ -> RETURN_
-- ============================================================================

-- ============================================================================
-- STEP 1: Create sequences for atomic ID generation
-- ============================================================================
-- We use per-user sequences to ensure IDs are unique across users
-- and never reused even if records are deleted.

-- Sequence for expense IDs
CREATE SEQUENCE IF NOT EXISTS public.expense_id_seq_global
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Sequence for debt IDs
CREATE SEQUENCE IF NOT EXISTS public.debt_id_seq_global
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Sequence for return IDs
CREATE SEQUENCE IF NOT EXISTS public.return_id_seq_global
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- ============================================================================
-- STEP 2: Create function to generate next ID atomically
-- ============================================================================

-- Function to generate next expense ID
CREATE OR REPLACE FUNCTION public.generate_next_expense_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id BIGINT;
  result TEXT;
BEGIN
  -- Get next value from sequence (atomic operation)
  next_id := nextval('public.expense_id_seq_global');
  result := 'EXPENSE_' || next_id;
  
  RETURN result;
END;
$$;

-- Function to generate next debt ID
CREATE OR REPLACE FUNCTION public.generate_next_debt_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id BIGINT;
  result TEXT;
BEGIN
  -- Get next value from sequence (atomic operation)
  next_id := nextval('public.debt_id_seq_global');
  result := 'DEBT_' || next_id;
  
  RETURN result;
END;
$$;

-- Function to generate next return ID
CREATE OR REPLACE FUNCTION public.generate_next_return_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_id BIGINT;
  result TEXT;
BEGIN
  -- Get next value from sequence (atomic operation)
  next_id := nextval('public.return_id_seq_global');
  result := 'RETURN_' || next_id;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- STEP 3: Backfill existing records with new format
-- ============================================================================

-- Update existing expense IDs from EXP_X to EXPENSE_X
UPDATE public.expenses
SET expense_id = 'EXPENSE_' || SUBSTRING(expense_id FROM 5)
WHERE expense_id LIKE 'EXP_%' AND expense_id NOT LIKE 'EXPENSE_%';

-- Update existing return IDs from RET_X to RETURN_X
UPDATE public.debt_returns
SET return_id = 'RETURN_' || SUBSTRING(return_id FROM 5)
WHERE return_id LIKE 'RET_%' AND return_id NOT LIKE 'RETURN_%';

-- Debt IDs are already in correct format (DEBT_X), no changes needed

-- ============================================================================
-- STEP 4: Sync sequences with existing data
-- ============================================================================

-- Find the highest expense ID number and set sequence accordingly
DO $$
DECLARE
  max_expense_num BIGINT := 0;
  max_debt_num BIGINT := 0;
  max_return_num BIGINT := 0;
  current_num BIGINT;
BEGIN
  -- Find max expense number
  FOR current_num IN 
    SELECT COALESCE(MAX(CAST(SUBSTRING(expense_id FROM 9) AS BIGINT)), 0)
    FROM public.expenses
    WHERE expense_id LIKE 'EXPENSE_%'
  LOOP
    max_expense_num := GREATEST(max_expense_num, current_num);
  END LOOP;
  
  -- Find max debt number
  FOR current_num IN 
    SELECT COALESCE(MAX(CAST(SUBSTRING(debt_id FROM 6) AS BIGINT)), 0)
    FROM public.debts
    WHERE debt_id LIKE 'DEBT_%'
  LOOP
    max_debt_num := GREATEST(max_debt_num, current_num);
  END LOOP;
  
  -- Find max return number
  FOR current_num IN 
    SELECT COALESCE(MAX(CAST(SUBSTRING(return_id FROM 8) AS BIGINT)), 0)
    FROM public.debt_returns
    WHERE return_id LIKE 'RETURN_%'
  LOOP
    max_return_num := GREATEST(max_return_num, current_num);
  END LOOP;
  
  -- Set sequences to continue from the next number
  IF max_expense_num > 0 THEN
    PERFORM setval('public.expense_id_seq_global', max_expense_num);
  END IF;
  
  IF max_debt_num > 0 THEN
    PERFORM setval('public.debt_id_seq_global', max_debt_num);
  END IF;
  
  IF max_return_num > 0 THEN
    PERFORM setval('public.return_id_seq_global', max_return_num);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add check constraints to enforce ID format
-- ============================================================================

-- Add constraint for expense IDs
ALTER TABLE public.expenses
DROP CONSTRAINT IF EXISTS chk_expense_id_format;

ALTER TABLE public.expenses
ADD CONSTRAINT chk_expense_id_format
CHECK (expense_id ~ '^EXPENSE_[0-9]+$');

-- Add constraint for debt IDs
ALTER TABLE public.debts
DROP CONSTRAINT IF EXISTS chk_debt_id_format;

ALTER TABLE public.debts
ADD CONSTRAINT chk_debt_id_format
CHECK (debt_id ~ '^DEBT_[0-9]+$');

-- Add constraint for return IDs
ALTER TABLE public.debt_returns
DROP CONSTRAINT IF EXISTS chk_return_id_format;

ALTER TABLE public.debt_returns
ADD CONSTRAINT chk_return_id_format
CHECK (return_id ~ '^RETURN_[0-9]+$');

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

-- Grant execute permissions on ID generation functions to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_next_expense_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_debt_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_return_id() TO authenticated;

-- Grant usage on sequences to authenticated users
GRANT USAGE ON SEQUENCE public.expense_id_seq_global TO authenticated;
GRANT USAGE ON SEQUENCE public.debt_id_seq_global TO authenticated;
GRANT USAGE ON SEQUENCE public.return_id_seq_global TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Sequences are global (not per-user) to ensure uniqueness across all users
-- 2. IDs are never reused, even if records are deleted
-- 3. The SECURITY DEFINER clause allows the function to access sequences
-- 4. Check constraints ensure ID format consistency
-- 5. Existing data is migrated automatically
-- 6. The migration is idempotent (can be run multiple times safely)
-- ============================================================================
