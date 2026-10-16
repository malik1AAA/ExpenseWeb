-- ============================================================================
-- PERSONAL FINANCE DATABASE SCHEMA
-- ============================================================================
-- This migration creates the database schema for the Personal Finance app
-- with multi-user support via Supabase authentication.
--
-- Tables:
--   1. expenses - Track daily expenses
--   2. debts - Track money lent/borrowed
--   3. debt_returns - Track debt repayments
--   4. categories - Expense categories
--
-- All tables include:
--   - UUID primary key (id)
--   - user_id foreign key to auth.users
--   - Business ID fields (expense_id, debt_id, etc.)
--   - Timestamps (created_at, updated_at)
--   - Row Level Security (RLS) - configured in Phase 3
-- ============================================================================

-- ============================================================================
-- TABLE: expenses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User association (required)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business fields (preserve existing structure)
  expense_id TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, expense_id)
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_id ON public.expenses(user_id, expense_id);

-- ============================================================================
-- TABLE: debts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.debts (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User association (required)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business fields (preserve existing structure)
  debt_id TEXT NOT NULL,
  person TEXT NOT NULL,
  debt_category TEXT NOT NULL CHECK (debt_category IN ('Food', 'Cash')),
  direction TEXT NOT NULL CHECK (direction IN ('Lent', 'Borrowed')),
  original_amount DECIMAL(12, 2) NOT NULL CHECK (original_amount > 0),
  date DATE NOT NULL,
  due_date DATE,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, debt_id)
);

-- Indexes for debts
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_date ON public.debts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_debts_direction ON public.debts(user_id, direction);
CREATE INDEX IF NOT EXISTS idx_debts_debt_id ON public.debts(user_id, debt_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts(user_id, due_date);

-- ============================================================================
-- TABLE: debt_returns
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.debt_returns (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User association (required)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business fields (preserve existing structure)
  return_id TEXT NOT NULL,
  debt_id TEXT NOT NULL,  -- References debts.debt_id (same user)
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, return_id)
);

-- Indexes for debt_returns
CREATE INDEX IF NOT EXISTS idx_debt_returns_user_id ON public.debt_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_returns_debt_id ON public.debt_returns(user_id, debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_returns_date ON public.debt_returns(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_debt_returns_return_id ON public.debt_returns(user_id, return_id);

-- ============================================================================
-- TABLE: categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User association (required)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business fields (preserve existing structure)
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Expense' CHECK (type = 'Expense'),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, category_id)
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_category_id ON public.categories(user_id, category_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
-- This function automatically updates the updated_at timestamp on row updates

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.debt_returns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.expenses IS 'User expense records';
COMMENT ON TABLE public.debts IS 'User debt records (lent or borrowed)';
COMMENT ON TABLE public.debt_returns IS 'Debt repayment records';
COMMENT ON TABLE public.categories IS 'User-defined expense categories';

COMMENT ON COLUMN public.expenses.expense_id IS 'Business ID (e.g., EXP_1)';
COMMENT ON COLUMN public.debts.debt_id IS 'Business ID (e.g., DEBT_1)';
COMMENT ON COLUMN public.debt_returns.return_id IS 'Business ID (e.g., RET_1)';
COMMENT ON COLUMN public.debt_returns.debt_id IS 'References debts.debt_id for same user';
COMMENT ON COLUMN public.categories.category_id IS 'Business ID (e.g., food, transport)';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All tables have user_id foreign key to auth.users with CASCADE delete
-- 2. Business IDs (expense_id, debt_id, etc.) are unique per user
-- 3. Amounts use DECIMAL(12,2) for precision
-- 4. CHECK constraints enforce valid values for debt_category, direction, type
-- 5. Indexes optimize common queries (by user, date, category, etc.)
-- 6. updated_at is automatically maintained via triggers
-- 7. RLS policies will be added in Phase 3
-- ============================================================================
