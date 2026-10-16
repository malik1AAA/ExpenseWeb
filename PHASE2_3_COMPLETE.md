# Phase 2 & 3 Complete: Database Schema & Security ✅

## What Was Implemented

### Phase 2: Database Schema

Created comprehensive database schema with 4 tables:

1. **expenses** - Track daily expenses
2. **debts** - Track money lent/borrowed
3. **debt_returns** - Track debt repayments
4. **categories** - User-defined expense categories

**Key Features:**
- UUID primary keys for all tables
- `user_id` foreign key to `auth.users` with CASCADE delete
- Business ID fields preserved (expense_id, debt_id, return_id, category_id)
- All existing business fields maintained
- Proper data types and constraints
- CHECK constraints for validation (amounts >= 0, valid directions, etc.)
- UNIQUE constraints per user for business IDs
- Automatic `updated_at` timestamps via triggers
- Performance indexes on common query fields

### Phase 3: Security (RLS)

Implemented Row Level Security on all tables:

**Security Model:**
- Users can only access their own data
- All operations (SELECT, INSERT, UPDATE, DELETE) are restricted by `user_id`
- `debt_returns` validates that referenced debts belong to the same user
- No cross-user data access possible
- Service role key bypasses RLS (server-side only)

**Policies Created:**
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
- 16 total policies across all tables
- All use `auth.uid()` for user identification
- debt_returns includes additional debt ownership validation

---

## Files Created

```
✅ supabase/migrations/001_initial_schema.sql
   - Creates all 4 tables
   - Adds indexes for performance
   - Creates updated_at trigger function
   - Applies triggers to all tables

✅ supabase/migrations/002_rls_policies.sql
   - Enables RLS on all tables
   - Creates 16 security policies
   - Ensures user data isolation
   - Validates debt_returns references

✅ SUPABASE_SETUP.md
   - Complete setup guide
   - Step-by-step instructions
   - Schema documentation
   - Security model explanation
   - Verification checklist
   - Troubleshooting guide
```

---

## Database Schema Summary

### Table: expenses
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- expense_id (TEXT, business ID like EXP_1)
- date (DATE)
- description (TEXT)
- category (TEXT)
- amount (DECIMAL 12,2)
- payment_method (TEXT)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Table: debts
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- debt_id (TEXT, business ID like DEBT_1)
- person (TEXT)
- debt_category (TEXT, CHECK: Food/Cash)
- direction (TEXT, CHECK: Lent/Borrowed)
- original_amount (DECIMAL 12,2)
- date (DATE)
- due_date (DATE)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Table: debt_returns
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- return_id (TEXT, business ID like RET_1)
- debt_id (TEXT, references debts.debt_id)
- date (DATE)
- amount (DECIMAL 12,2)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Table: categories
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- category_id (TEXT, business ID like 'food')
- category_name (TEXT)
- type (TEXT, DEFAULT 'Expense')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

---

## Security Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| expenses | ✅ Own data | ✅ Own data | ✅ Own data | ✅ Own data |
| debts | ✅ Own data | ✅ Own data | ✅ Own data | ✅ Own data |
| debt_returns | ✅ Own data | ✅ Own data + valid debt | ✅ Own data + valid debt | ✅ Own data |
| categories | ✅ Own data | ✅ Own data | ✅ Own data | ✅ Own data |

**Special Security:**
- debt_returns INSERT/UPDATE policies verify the referenced debt belongs to the same user
- Prevents cross-user debt manipulation
- All policies use `auth.uid()` for secure user identification

---

## How to Apply Migrations

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor"

### Step 2: Run Schema Migration
1. Click "New Query"
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into editor
4. Click "Run"
5. Verify: "Success. No rows returned"

### Step 3: Run RLS Migration
1. Click "New Query" (or clear editor)
2. Copy contents of `supabase/migrations/002_rls_policies.sql`
3. Paste into editor
4. Click "Run"
5. Verify: "Success. No rows returned"

### Step 4: Verify Setup
1. Go to "Table Editor"
2. Verify 4 tables exist: expenses, debts, debt_returns, categories
3. Click on each table to verify columns
4. Go to "Authentication" → "Policies"
5. Verify 4 policies per table (16 total)

---

## Verification Checklist

After running migrations, verify:

- [ ] All 4 tables exist in Table Editor
- [ ] Each table has correct columns and types
- [ ] Indexes are created (check Database → Indexes)
- [ ] RLS is enabled on all tables
- [ ] Each table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] debt_returns INSERT policy includes debt ownership check
- [ ] Triggers exist for updated_at (check Database → Triggers)

---

## Testing the Setup

### Create Test User
1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Note the user's UUID

### Insert Test Data
```sql
-- Insert a test expense (replace YOUR-USER-UUID)
INSERT INTO public.expenses (user_id, expense_id, date, description, category, amount)
VALUES (
  'YOUR-USER-UUID',
  'EXP_1',
  '2024-01-15',
  'Test expense',
  'food',
  50.00
);

-- Verify it was inserted
SELECT * FROM public.expenses WHERE user_id = 'YOUR-USER-UUID';
```

### Verify RLS Isolation
1. Create a second test user
2. Login as second user
3. Try to query first user's data:
```sql
SELECT * FROM public.expenses;
```
4. Should return 0 rows (RLS prevents access)

---

## Next Steps

✅ Phase 1: Supabase Configuration - COMPLETE
✅ Phase 2: Database Schema - COMPLETE
✅ Phase 3: Security (RLS) - COMPLETE

**Next: Phase 4 - Authentication**

Phase 4 will include:
- AuthContext for session management
- Login page
- Signup page
- Password reset page
- Protected routes
- Session persistence

---

## Important Notes

### Data Types
- All amounts use `DECIMAL(12,2)` for precision
- Dates use `DATE` type (no time component)
- Timestamps use `TIMESTAMPTZ` (timezone-aware)
- UUIDs use PostgreSQL's native `UUID` type

### Constraints
- `amount >= 0` for expenses
- `original_amount > 0` for debts
- `amount > 0` for debt_returns
- `debt_category IN ('Food', 'Cash')`
- `direction IN ('Lent', 'Borrowed')`
- `type = 'Expense'` for categories

### Indexes
Performance indexes on:
- `user_id` (all tables) - Fast user lookups
- `date` (all tables) - Fast date-based queries
- Business IDs - Fast ID lookups
- `category`, `direction`, `debt_id` - Fast filtering

### Triggers
- `updated_at` automatically updated on row modifications
- Trigger function: `handle_updated_at()`
- Applied to all 4 tables

---

## Troubleshooting

### Tables Not Created
- Check SQL Editor for errors
- Verify you're connected to the correct project
- Check Supabase logs (Database → Logs)

### RLS Not Working
- Verify RLS is enabled: Check table settings
- Verify policies exist: Authentication → Policies
- Ensure you're authenticated (not using service_role)

### Permission Denied Errors
- Check you're using the `anon` key in frontend
- Verify user is authenticated
- Check RLS policies are correctly configured

### Duplicate Key Errors
- Business IDs must be unique per user
- Use idGeneratorService for sequential IDs
- Check for existing records before insert

---

## Support

For detailed information, see:
- `SUPABASE_SETUP.md` - Complete setup guide
- `SUPABASE_CONFIG.md` - Configuration guide
- Migration files in `supabase/migrations/`

---

## Status

✅ **Phase 2 & 3: COMPLETE**

Database schema and security policies are ready.
Proceed to Phase 4: Authentication when ready.
