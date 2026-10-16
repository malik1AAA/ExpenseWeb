-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This migration enables RLS on all tables and creates policies to ensure
-- users can only access their own data.
--
-- Security Model:
--   - All tables have RLS enabled
--   - Users can only SELECT/INSERT/UPDATE/DELETE their own records
--   - user_id is always set to auth.uid() on INSERT
--   - debt_returns can only reference debts belonging to the same user
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- EXPENSES POLICIES
-- ============================================================================

-- SELECT: Users can only view their own expenses
CREATE POLICY "Users can view own expenses"
  ON public.expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own expenses
-- user_id is automatically set to the authenticated user
CREATE POLICY "Users can insert own expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own expenses
CREATE POLICY "Users can update own expenses"
  ON public.expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own expenses
CREATE POLICY "Users can delete own expenses"
  ON public.expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- DEBTS POLICIES
-- ============================================================================

-- SELECT: Users can only view their own debts
CREATE POLICY "Users can view own debts"
  ON public.debts
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own debts
CREATE POLICY "Users can insert own debts"
  ON public.debts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own debts
CREATE POLICY "Users can update own debts"
  ON public.debts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own debts
CREATE POLICY "Users can delete own debts"
  ON public.debts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- DEBT RETURNS POLICIES
-- ============================================================================

-- SELECT: Users can only view their own debt returns
CREATE POLICY "Users can view own debt returns"
  ON public.debt_returns
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own debt returns
-- Additionally, the debt_id must reference a debt belonging to the same user
CREATE POLICY "Users can insert own debt returns"
  ON public.debt_returns
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.debt_id = debt_returns.debt_id
      AND debts.user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update their own debt returns
CREATE POLICY "Users can update own debt returns"
  ON public.debt_returns
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.debts
      WHERE debts.debt_id = debt_returns.debt_id
      AND debts.user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete their own debt returns
CREATE POLICY "Users can delete own debt returns"
  ON public.debt_returns
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CATEGORIES POLICIES
-- ============================================================================

-- SELECT: Users can only view their own categories
CREATE POLICY "Users can view own categories"
  ON public.categories
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own categories
CREATE POLICY "Users can insert own categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own categories
CREATE POLICY "Users can update own categories"
  ON public.categories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own categories
CREATE POLICY "Users can delete own categories"
  ON public.categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. All policies use auth.uid() to ensure user isolation
-- 2. debt_returns INSERT/UPDATE policies verify the referenced debt belongs to the same user
-- 3. No policy allows access to other users' data
-- 4. CASCADE delete on user_id ensures all user data is removed when account is deleted
-- 5. RLS is enforced for all operations (SELECT, INSERT, UPDATE, DELETE)
-- 6. Service role key bypasses RLS (use only in secure server environments)
-- ============================================================================
