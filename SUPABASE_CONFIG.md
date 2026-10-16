# Supabase Setup Guide

## Phase 1: Configuration ✅

This guide walks you through setting up Supabase for your Personal Finance application.

### Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `personal-finance` (or your choice)
   - Database Password: (save this somewhere safe)
   - Region: Choose closest to you
5. Wait for project to initialize (2-3 minutes)

### Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

⚠️ **IMPORTANT**: Only use the `anon` key in frontend code. Never use the `service_role` key.

### Step 3: Configure Environment Variables

1. Open `.env.local` file in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-actual-anon-key-here
```

3. Save the file

### Step 4: Verify Configuration

Run the development server:

```bash
npm run dev
```

Open browser console (F12). You should NOT see errors about missing environment variables.

### Step 5: Run Database Migrations

Follow the instructions in `SUPABASE_SETUP.md` (Phase 2) to create the database tables.

---

## Security Notes

✅ **Safe to expose:**
- `anon` key (publishable key)
- Project URL

❌ **Never expose:**
- `service_role` key
- Database password
- Any secret keys

The `anon` key is protected by Row Level Security (RLS) policies that we'll set up in Phase 3.

---

## Next Steps

After completing Phase 1, proceed to:
- **Phase 2**: Database Schema (create tables)
- **Phase 3**: Security (RLS policies)
- **Phase 4**: Authentication (login/signup)

---

## Troubleshooting

### "Missing VITE_SUPABASE_URL" error
- Make sure `.env.local` exists
- Check that variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Restart the dev server after creating `.env.local`

### "Invalid API key" error
- Double-check you copied the `anon` key, not the `service_role` key
- Ensure there are no extra spaces in `.env.local`

### Connection refused
- Check your Project URL is correct
- Verify your Supabase project is active (not paused)
