-- ============================================================================
-- MIGRATION 005: Fix Bulk Repayment ID Format and Add Foreign Key
-- ============================================================================
-- This migration fixes two critical issues:
--
-- Issue 1: Bulk repayment RPC generates return IDs in wrong format
--   - Old format: RET_YYYYMMDDHH24MISS_0001_a1b2c3
--   - Required format: RETURN_1, RETURN_2, etc.
--   - Fix: Update RPC to use generate_next_return_id() function
--
-- Issue 2: No foreign key constraint between debt_returns and debts
--   - debt_returns.debt_id references debts.debt_id (business ID)
--   - No database-level enforcement of referential integrity
--   - Fix: Add composite foreign key (user_id, debt_id)
--
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Bulk Repayment RPC Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.bulk_repay_person(
  p_person TEXT,
  p_direction TEXT,
  p_debt_category TEXT,
  p_total_amount DECIMAL,
  p_date DATE,
  p_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_total_outstanding DECIMAL;
  v_remaining_payment DECIMAL;
  v_allocation JSON;
  v_debt_record RECORD;
  v_debt_remaining DECIMAL;
  v_allocated DECIMAL;
  v_return_id TEXT;
  v_inserted_count INT := 0;
  v_allocation_array JSONB := '[]'::JSONB;
BEGIN
  -- 1. Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate inputs
  IF p_total_amount IS NULL OR p_total_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_person IS NULL OR TRIM(p_person) = '' THEN
    RAISE EXCEPTION 'Person is required';
  END IF;

  IF p_direction NOT IN ('Lent', 'Borrowed') THEN
    RAISE EXCEPTION 'Direction must be Lent or Borrowed';
  END IF;

  IF p_debt_category NOT IN ('Food', 'Cash') THEN
    RAISE EXCEPTION 'Debt category must be Food or Cash';
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Date is required';
  END IF;

  -- 3. Calculate total outstanding for eligible debts
  SELECT COALESCE(SUM(
    d.original_amount - COALESCE(
      (SELECT SUM(r.amount) FROM public.debt_returns r
       WHERE r.user_id = v_user_id AND r.debt_id = d.debt_id), 0
    )
  ), 0)
  INTO v_total_outstanding
  FROM public.debts d
  WHERE d.user_id = v_user_id
    AND d.person = p_person
    AND d.direction = p_direction
    AND d.debt_category = p_debt_category
    AND d.original_amount - COALESCE(
      (SELECT SUM(r.amount) FROM public.debt_returns r
       WHERE r.user_id = v_user_id AND r.debt_id = d.debt_id), 0
    ) > 0;

  IF v_total_outstanding <= 0 THEN
    RAISE EXCEPTION 'No outstanding debts found for this person, direction, and category';
  END IF;

  IF p_total_amount > v_total_outstanding THEN
    RAISE EXCEPTION 'Payment amount (%) exceeds total outstanding (%)', p_total_amount, v_total_outstanding;
  END IF;

  -- 4. Allocate payment oldest-first
  v_remaining_payment := p_total_amount;

  FOR v_debt_record IN
    SELECT
      d.debt_id,
      d.original_amount,
      COALESCE(
        (SELECT SUM(r.amount) FROM public.debt_returns r
         WHERE r.user_id = v_user_id AND r.debt_id = d.debt_id), 0
      ) AS total_returned
    FROM public.debts d
    WHERE d.user_id = v_user_id
      AND d.person = p_person
      AND d.direction = p_direction
      AND d.debt_category = p_debt_category
    ORDER BY d.date ASC, d.debt_id ASC
  LOOP
    EXIT WHEN v_remaining_payment <= 0;

    v_debt_remaining := v_debt_record.original_amount - v_debt_record.total_returned;

    IF v_debt_remaining <= 0 THEN
      CONTINUE;
    END IF;

    v_allocated := LEAST(v_remaining_payment, v_debt_remaining);

    -- Generate unique return ID using the atomic sequence function
    -- This ensures format matches the constraint: RETURN_1, RETURN_2, etc.
    v_return_id := public.generate_next_return_id();

    -- Insert debt return
    INSERT INTO public.debt_returns (
      user_id, return_id, debt_id, date, amount, notes
    ) VALUES (
      v_user_id, v_return_id, v_debt_record.debt_id, p_date, v_allocated, p_notes
    );

    -- Build allocation entry
    v_allocation_array := v_allocation_array || JSONB_BUILD_OBJECT(
      'debt_id', v_debt_record.debt_id,
      'allocated', v_allocated,
      'remaining_before', v_debt_remaining,
      'remaining_after', v_debt_remaining - v_allocated,
      'return_id', v_return_id
    );

    v_remaining_payment := v_remaining_payment - v_allocated;
    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  -- 5. Build response
  v_allocation := JSONB_BUILD_OBJECT(
    'success', true,
    'person', p_person,
    'direction', p_direction,
    'debt_category', p_debt_category,
    'total_paid', p_total_amount,
    'total_outstanding', v_total_outstanding,
    'allocations', v_allocation_array,
    'allocations_count', v_inserted_count,
    'date', p_date,
    'notes', p_notes
  );

  RETURN v_allocation;
END;
$$;

COMMENT ON FUNCTION public.bulk_repay_person IS
  'Atomically allocates a bulk repayment across a persons outstanding debts (same direction and category), ordered by date ASC, debt_id ASC. Uses generate_next_return_id() for sequential RETURN_N format. Returns allocation details as JSON.';

-- ============================================================================
-- PART 2: Add Foreign Key Constraint
-- ============================================================================

-- First, verify that all existing debt_returns reference valid debts
-- This query will fail if there are orphaned records
DO $$
DECLARE
  orphaned_count INT;
BEGIN
  SELECT COUNT(*)
  INTO orphaned_count
  FROM public.debt_returns dr
  WHERE NOT EXISTS (
    SELECT 1 
    FROM public.debts d 
    WHERE d.user_id = dr.user_id 
      AND d.debt_id = dr.debt_id
  );

  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Cannot add foreign key: % orphaned debt_return records found', orphaned_count;
  END IF;
END $$;

-- Add composite foreign key constraint
-- This ensures debt_returns.debt_id references a valid debt for the same user
ALTER TABLE public.debt_returns
DROP CONSTRAINT IF EXISTS fk_debt_returns_debt;

ALTER TABLE public.debt_returns
ADD CONSTRAINT fk_debt_returns_debt
FOREIGN KEY (user_id, debt_id) 
REFERENCES debts(user_id, debt_id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT fk_debt_returns_debt ON public.debt_returns IS
  'Foreign key ensuring debt_returns reference valid debts for the same user. Uses composite key (user_id, debt_id) to maintain user isolation. ON DELETE RESTRICT prevents deletion of debts with return history.';

-- ============================================================================
-- PART 3: Verify and Report
-- ============================================================================

-- Report the changes
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  -- Check if foreign key was added
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public'
      AND table_name = 'debt_returns'
      AND constraint_name = 'fk_debt_returns_debt'
      AND constraint_type = 'FOREIGN KEY'
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE NOTICE '✓ Foreign key constraint fk_debt_returns_debt added successfully';
  ELSE
    RAISE EXCEPTION 'Failed to add foreign key constraint';
  END IF;

  RAISE NOTICE '✓ Bulk repayment RPC updated to use generate_next_return_id()';
  RAISE NOTICE '✓ Return ID format: RETURN_1, RETURN_2, etc.';
  RAISE NOTICE '✓ Foreign key ensures referential integrity between debt_returns and debts';
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The foreign key uses composite key (user_id, debt_id) to maintain user isolation
-- 2. ON DELETE RESTRICT prevents accidental deletion of debts with return history
-- 3. ON UPDATE CASCADE ensures debt_id updates propagate (though this shouldn't happen)
-- 4. The bulk repayment RPC now uses the same ID generation as regular returns
-- 5. All return IDs now follow the format: RETURN_1, RETURN_2, RETURN_3, etc.
-- 6. The constraint chk_return_id_format validates this format
-- ============================================================================
