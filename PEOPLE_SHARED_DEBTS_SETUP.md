# People, Shared Debts, and Repayment Requests

## Database layout checked

The checked-in migrations define `debts.id` as the UUID primary key, `debts.debt_id` as the per-user readable business ID, and `debts.user_id` as the owner. `debt_returns` refers to a debt through `(user_id, debt_id)` and keeps its existing return ID generator. The existing debt direction values are `Lent` and `Borrowed`.

No live database connection or email-provider configuration is present in this repository. The additive migration below is based on the checked-in Supabase schema; review and apply it in the target Supabase project before deploying the frontend changes. It does not drop the legacy `debts.person` field or modify existing amounts, dates, business IDs, or returns.

## Deployment

1. Review and apply [`supabase/migrations/007_people_shared_debts_and_payment_requests.sql`](./supabase/migrations/007_people_shared_debts_and_payment_requests.sql) in the Supabase SQL editor. It is additive, retains the original person-name column, backfills existing names, and includes the RLS policies and atomic repayment/account-linking RPCs.
2. Optionally run [`supabase/backfills/people_debt_backfill.sql`](./supabase/backfills/people_debt_backfill.sql) after migration 007. It is safe to rerun and reports any missing or cross-owner person references.
3. Configure Gmail SMTP as **Vercel server-only environment variables** in Project Settings → Environment Variables:

   ```text
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-gmail-address@gmail.com
   SMTP_PASS=your-google-app-password
   SMTP_FROM_NAME=ExpenseWeb
   SMTP_FROM_EMAIL=your-gmail-address@gmail.com
   MAILER_SHARED_SECRET=<long-random-secret>
   ```

   `SMTP_PASS` must be a Google **App Password**, not the Gmail account password. Enable Google 2-Step Verification and generate an App Password. `SMTP_FROM_EMAIL` must be the same Gmail address as `SMTP_USER` or an alias configured in Gmail. Do not use a `VITE_` prefix for SMTP values: Vite variables with that prefix are exposed to browser code.
4. Add these Supabase Edge Function secrets. Use your deployed Vercel URL and the exact same shared secret configured in Vercel:

   ```text
   supabase secrets set APP_URL=https://your-app.vercel.app
   supabase secrets set SMTP_MAILER_URL=https://your-app.vercel.app/api/send-email
   supabase secrets set SMTP_MAILER_SECRET=<same-long-random-secret>
   ```

   The Vercel endpoint is protected by `MAILER_SHARED_SECRET`; Supabase calls it server-to-server. Keep Supabase service-role keys and SMTP credentials out of React environment variables.
5. Deploy the `api/send-email.js` Vercel function with the frontend. Then, from the repository root, link the Supabase CLI to the same project whose URL is in `VITE_SUPABASE_URL` and deploy both functions:

   ```text
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase functions deploy invite-person
   npx supabase functions deploy send-debt-notifications
   ```

   The project ref is the subdomain in `https://<project-ref>.supabase.co`. After deployment, confirm both `/functions/v1/invite-person` and `/functions/v1/send-debt-notifications` no longer return 404 on an OPTIONS request. The ignored local `.env` has SMTP settings; fill them for local use and run `npx vercel dev` so the Vercel function runs locally. For production, configure Vercel Project Settings rather than committing `.env`; `.env.example` is only a placeholder template.
6. Failed invitation email attempts delete their unused invitation token; failed debt notifications remain retryable in the private outbox and do not roll back financial changes.

## Account linking

The person owner stores the contact email but cannot set `linked_user_id`. An owner sends a one-time email invitation through the `invite-person` Edge Function, which forwards email to the authenticated Vercel SMTP endpoint. The invitation token is stored as a SHA-256 hash and expires after seven days. The recipient signs in to ExpenseWeb using the invited email, which must be verified, and accepts the invite. A database RPC checks the authenticated user and verified email before linking. Changing a person's email clears an existing link and requires a fresh invitation. The UI only reads a generated linked-account boolean, not another account's UUID.

## Repayment direction

- **Lent:** the linked participant submits a repayment request. The debt owner approves or rejects it. Only approval inserts one `debt_returns` row.
- **Borrowed:** the debt owner records a payment request. The linked participant confirms or rejects receipt. Only confirmation inserts one `debt_returns` row.

The request RPCs lock the debt and request rows, verify the caller's role, enforce one pending request per debt, and check the remaining balance again before approval. Pending and rejected requests do not affect the balance.

## Two-account manual verification

Use two test accounts with verified email addresses.

1. As account A, add a person with account B's email, then send the invitation.
2. As account B, accept the invitation while signed in using the matching verified email.
3. As A, create a Lent debt for that person. Confirm B can see only the shared debt and its permitted return history; confirm B cannot edit or delete the debt or access A's other expenses/debts.
4. As B, submit a repayment request. Confirm the debt balance is unchanged and the request is pending.
5. As A, approve it and confirm exactly one existing-format `RETURN_n` payment is present and the balance changes once. Try approving it again and confirm it fails.
6. Repeat with a Borrowed debt: A requests payment confirmation, B confirms it, and only then does the balance change.
7. Test rejection, over-balance amounts, a second pending request, inactive people, duplicate normalized names/emails, email changes after linking, an expired invitation, and an unverified/mismatched account.
8. Temporarily use an invalid Gmail App Password and repeat a debt change. Confirm the debt transaction remains committed and the outbox records the delivery failure. Restore the correct App Password and retry.
9. Run the standalone backfill verification queries and confirm both invalid-reference counts are zero.

The migration and UI changes are present in the repository but have not been applied to a live Supabase project or verified against two deployed accounts. Gmail email delivery requires the Vercel SMTP environment variables and Supabase function secrets described above.
