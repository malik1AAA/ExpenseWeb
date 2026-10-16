# Supabase Database Setup Guide

## Overview

This guide walks you through setting up the database schema and security policies for the Personal Finance application.

**Phase 2**: Database Schema - Creates tables for expenses, debts, debt_returns, and categories
**Phase 3**: Security (RLS) - Ensures users can only access their own data

---

## Prerequisites

✅ Phase 1 complete (Supabase client configured)
✅ Supabase project created
✅ `.env.local` configured with your credentials

---

## Step 1: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Phase 2 Migration (Schema)**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - You should see: "Success. No rows returned"

4. **Run Phase 3 Migration (RLS Policies)**
   - Open `supabase/migrations/002_rls_policies.sql`
   - Copy the entire contents
   - Paste into the SQL Editor (replace previous query)
   - Click "Run"
   - You should see: "Success. No rows returned"

### Option B: Using Supabase CLI (Alternative)

If you have the Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref your-project-id

# Apply migrations
supabase db push
```

---

## Step 2: Verify Tables Were Created

1. **Go to Table Editor**
   - Click "Table Editor" in the left sidebar
   - You should see 4 tables:
     - `expenses`
     - `debts`
     - `debt_returns`
     - `categories`

2. **Check Table Structure**
   - Click on `expenses` table
   - Verify columns:
     - `id` (uuid)
     - `user_id` (uuid)
     - `expense_id` (text)
     - `date` (date)
     - `description` (text)
     - `category` (text)
     - `amount` (numeric)
     - `payment_method` (text)
     - `notes` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

3. **Verify Other Tables**
   - Repeat for `debts`, `debt_returns`, and `categories`

---

## Step 3: Verify RLS Policies

1. **Go to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Policies"

2. **Check Policies for Each Table**
   - Click on "expenses" table
   - You should see 4 policies:
     - "Users can view own expenses" (SELECT)
     - "Users can insert own expenses" (INSERT)
     - "Users can update own expenses" (UPDATE)
     - "Users can delete own expenses" (DELETE)

3. **Verify Other Tables**
   - Repeat for `debts`, `debt_returns`, and `categories`
   - `debt_returns` should have additional checks for debt ownership

---

## Database Schema Details

### Table: expenses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal primary key |
| user_id | UUID | NOT NULL, FK to auth.users | Owner of the expense |
| expense_id | TEXT | NOT NULL, UNIQUE per user | Business ID (e.g., EXP_1) |
| date | DATE | NOT NULL | Expense date |
| description | TEXT | NOT NULL | Expense description |
| category | TEXT | NOT NULL | Category reference |
| amount | DECIMAL(12,2) | NOT NULL, CHECK >= 0 | Expense amount |
| payment_method | TEXT | | Payment method |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_expenses_user_id` - Fast user lookups
- `idx_expenses_date` - Fast date-based queries
- `idx_expenses_category` - Fast category filtering
- `idx_expenses_expense_id` - Fast expense ID lookups

### Table: debts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Internal primary key |
| user_id | UUID | NOT NULL, FK to auth.users | Owner of the debt |
| debt_id | TEXT | NOT NULL, UNIQUE per user | Business ID (e.g., DEBT_1) |
| person | TEXT | NOT NULL | Person name |
| debt_category | TEXT | NOT NULL, CHECK IN ('Food', 'Cash') | Debt category |
| direction | TEXT | NOT NULL, CHECK IN ('Lent', 'Borrowed') | Lent or Borrowed |
| original_amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Original amount |
| date | DATE | NOT NULL | Debt date |
| due_date | DATE | | Due date |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_debts_user_id` - Fast user lookups
- `idx_debts_date` - Fast date-based queries
- `idx_debts_direction` - Fast direction filtering
- `idx_debts_debt_id` - Fast debt ID lookups
- `idx_debts_due_date` - Fast due date queries

### Table: debt_returns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Internal primary key |
| user_id | UUID | NOT NULL, FK to auth.users | Owner of the return |
| return_id | TEXT | NOT NULL, UNIQUE per user | Business ID (e.g., RET_1) |
| debt_id | TEXT | NOT NULL | References debts.debt_id (same user) |
| date | DATE | NOT NULL | Return date |
| amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Return amount |
| notes | TEXT | | Additional notes |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_debt_returns_user_id` - Fast user lookups
- `idx_debt_returns_debt_id` - Fast debt lookups
- `idx_debt_returns_date` - Fast date-based queries
- `idx_debt_returns_return_id` - Fast return ID lookups

**Special Constraint:**
- INSERT/UPDATE policies verify that `debt_id` references a debt belonging to the same user

### Table: categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Internal primary key |
| user_id | UUID | NOT NULL, FK to auth.users | Owner of the category |
| category_id | TEXT | NOT NULL, UNIQUE per user | Business ID (e.g., food) |
| category_name | TEXT | NOT NULL | Display name |
| type | TEXT | NOT NULL, DEFAULT 'Expense', CHECK = 'Expense' | Category type |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_categories_user_id` - Fast user lookups
- `idx_categories_category_id` - Fast category ID lookups

---

## Security Model (RLS Policies)

### How It Works

1. **User Isolation**: Every table has a `user_id` column that links records to authenticated users
2. **Automatic Enforcement**: RLS policies automatically filter data based on `auth.uid()`
3. **No Cross-User Access**: Users cannot see, modify, or delete other users' data
4. **Service Role Bypass**: Only the service role key (server-side) can bypass RLS

### Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| expenses | Own data only | Own data only | Own data only | Own data only |
| debts | Own data only | Own data only | Own data only | Own data only |
| debt_returns | Own data only | Own data + valid debt reference | Own data + valid debt reference | Own data only |
| categories | Own data only | Own data only | Own data only | Own data only |

### Special Security Features

**debt_returns Table:**
- INSERT policy checks that the referenced `debt_id` belongs to the same user
- UPDATE policy also validates debt ownership
- Prevents users from creating returns for other users' debts

**CASCADE Delete:**
- When a user account is deleted, all their data is automatically removed
- Prevents orphaned records

---

## Verification Checklist

After running migrations, verify:

- [ ] All 4 tables exist in Table Editor
- [ ] Each table has correct columns and types
- [ ] Indexes are created (check in Database → Indexes)
- [ ] RLS is enabled on all tables
- [ ] Each table has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] debt_returns INSERT policy includes debt ownership check
- [ ] Triggers exist for updated_at (check in Database → Triggers)

---

## Testing the Setup

### Test 1: Create a Test User

1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. Note the user's UUID

### Test 2: Insert Test Data

Run this SQL (replace `YOUR-USER-UUID` with actual UUID):

```sql
-- Insert a test expense
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

### Test 3: Verify RLS Isolation

1. Create a second test user
2. Try to query the first user's data as the second user:

```sql
-- This should return 0 rows (RLS prevents access)
SELECT * FROM public.expenses;
```

If you see data, RLS is not working correctly. Check that:
- RLS is enabled on the table
- Policies are created correctly
- You're querying as an authenticated user (not service role)

---

## Troubleshooting

### Error: "relation already exists"

**Cause**: Tables already exist from a previous migration

**Solution**: 
```sql
-- Drop all tables (WARNING: This deletes all data!)
DROP TABLE IF EXISTS public.debt_returns;
DROP TABLE IF EXISTS public.debts;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.categories;

-- Then re-run migrations
```

### Error: "permission denied for table"

**Cause**: RLS policies not created or user not authenticated

**Solution**:
- Verify RLS policies exist (Authentication → Policies)
- Check you're using the `anon` key, not `service_role`
- Ensure user is authenticated

### Error: "duplicate key value violates unique constraint"

**Cause**: Trying to insert a record with duplicate business ID for the same user

**Solution**:
- Check your business IDs are unique per user
- Use the idGeneratorService to generate sequential IDs

### RLS Not Working

**Cause**: Policies not applied correctly

**Solution**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show 't' (true) for all 4 tables
```

---

## Next Steps

After completing Phase 2 and 3:

✅ Database schema created
✅ RLS policies configured
✅ Security verified

**Proceed to Phase 4**: Authentication (Login/Signup pages)

---

## Migration Files

- `supabase/migrations/001_initial_schema.sql` - Database schema
- `supabase/migrations/002_rls_policies.sql` - RLS policies

These files are version-controlled and can be re-run if needed.

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs (Database → Logs)
3. Verify environment variables in `.env.local`
4. Check browser console for client-side errors
