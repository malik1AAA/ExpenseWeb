-- ============================================================================
-- MIGRATION 003: Bulk Repayment RPC
-- ============================================================================
-- Adds an atomic RPC function for bulk repayment allocation.
--
-- The function:
--   1. Validates the caller is authenticated
--   2. Fetches eligible debts (same person, direction, debt_category, user)
--   3. Computes each debt's remaining balance from debt_returns
--   4. Sorts debts by date ASC, debt_id ASC (deterministic tie-breaker)
--   5. Allocates the payment oldest-first, never exceeding a debt's remaining
--   6. Rejects if payment > total outstanding, or payment <= 0
--   7. Inserts multiple debt_returns rows atomically
--   8. Returns the allocation as JSON for the client preview
--
-- Apply this migration in Supabase SQL Editor.
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

    -- Generate unique return ID
    v_return_id := 'RET_' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '_' ||
                   LPAD((v_inserted_count + 1)::TEXT, 4, '0') || '_' ||
                   SUBSTR(MD5(RANDOM()::TEXT), 1, 6);

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

-- ============================================================================
-- Grant execute permission to authenticated users
-- ============================================================================
-- Note: SECURITY DEFINER runs as the function owner (postgres), but we
-- explicitly filter by auth.uid() inside the function, so RLS is respected.
-- The function can only see/modify the authenticated user's data.

COMMENT ON FUNCTION public.bulk_repay_person IS
  'Atomically allocates a bulk repayment across a persons outstanding debts (same direction and category), ordered by date ASC, debt_id ASC. Returns allocation details as JSON.';
