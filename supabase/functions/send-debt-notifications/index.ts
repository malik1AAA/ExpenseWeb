import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeadersForRequest, jsonResponse } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersForRequest(request) });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Authentication required' }, 401, request);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await caller.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Authentication required' }, 401, request);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const emailFrom = Deno.env.get('EMAIL_FROM') || 'ExpenseWeb';
  const mailerSecret = Deno.env.get('SMTP_MAILER_SECRET');
  const mailerUrl = Deno.env.get('SMTP_MAILER_URL');
  const appUrl = Deno.env.get('APP_URL');
  if (!mailerSecret || !mailerUrl || !appUrl) {
    return jsonResponse({ error: 'Email service is not configured. Set SMTP_MAILER_URL, SMTP_MAILER_SECRET, and APP_URL in Supabase.' }, 503, request);
  }

  const { data: events, error: eventsError } = await admin
    .from('debt_notification_outbox')
    .select('id, actor_user_id, recipient_user_id, event_key, event_type, payload, status, attempts')
    .eq('actor_user_id', user.id)
    .in('status', ['pending', 'failed'])
    .order('created_at', { ascending: true })
    .limit(25);
  if (eventsError) return jsonResponse({ error: 'Could not load queued notifications.' }, 500, request);

  let sent = 0;
  const failures: string[] = [];
  for (const event of events || []) {
    const { data: claimed, error: claimError } = await admin
      .from('debt_notification_outbox')
      .update({ status: 'sending', attempts: event.attempts + 1, last_error: null })
      .eq('id', event.id)
      .in('status', ['pending', 'failed'])
      .select('id')
      .maybeSingle();
    if (claimError || !claimed) continue;

    try {
      const [{ data: recipientResult, error: recipientError }, { data: actorResult }] = await Promise.all([
        admin.auth.admin.getUserById(event.recipient_user_id),
        admin.auth.admin.getUserById(event.actor_user_id),
      ]);
      const recipient = recipientResult.user;
      if (recipientError || !recipient?.email || !recipient.email_confirmed_at) {
        throw new Error('Recipient does not have a verified email address.');
      }

      const payload = event.payload || {};
      const ownerId = payload.owner_user_id || event.actor_user_id;
      const { data: debt, error: debtError } = await admin
        .from('debts')
        .select('id, user_id, debt_id, person_id, person, direction, original_amount, date, due_date')
        .eq('user_id', ownerId)
        .eq('debt_id', payload.debt_id)
        .maybeSingle();
      if (debtError || !debt) throw new Error('Debt details were not available for notification.');

      const { data: person } = await admin.from('people').select('name').eq('id', debt.person_id).maybeSingle();
      const { data: requestRow } = payload.request_id
        ? await admin.from('debt_payment_requests')
          .select('amount, payment_date, notes')
          .eq('id', payload.request_id)
          .maybeSingle()
        : { data: null };
      const name = person?.name || debt.person;
      const actorName = String(actorResult.user?.user_metadata?.full_name || actorResult.user?.user_metadata?.name || 'An ExpenseWeb user');
      const summary = buildMessage(event.event_type, actorName, name, debt, requestRow, payload);
      const response = await fetch(mailerUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mailerSecret}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': event.event_key,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [recipient.email],
          subject: summary.subject,
          text: `${summary.text}\n\nOpen ExpenseWeb: ${new URL('/debts', appUrl).toString()}`,
          html: `<p>${escapeHtml(summary.text)}</p><p><a href="${escapeHtml(new URL('/debts', appUrl).toString())}">Open ExpenseWeb</a></p>`,
        }),
      });
      if (!response.ok) {
        let detail = `SMTP mail service returned HTTP ${response.status}.`;
        try {
          const responseBody = await response.json();
          if (typeof responseBody.error === 'string') detail = responseBody.error;
        } catch {
          // Keep the HTTP status when the mail service did not return JSON.
        }
        throw new Error(detail);
      }

      const { error: deliveredError } = await admin
        .from('debt_notification_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
        .eq('id', event.id);
      if (deliveredError) throw deliveredError;
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Notification delivery failed.';
      failures.push(`${event.id}: ${message}`);
      await admin
        .from('debt_notification_outbox')
        .update({ status: 'failed', last_error: message.slice(0, 500) })
        .eq('id', event.id);
    }
  }

  return jsonResponse({ sent, failed: failures.length, failures }, 200, request);
});

function buildMessage(type: string, sender: string, person: string, debt: Record<string, unknown>, request: Record<string, unknown> | null, payload: Record<string, unknown>) {
  if (type === 'debt_created' || type === 'debt_updated') {
    return {
      subject: type === 'debt_created' ? 'A debt was recorded in ExpenseWeb' : 'A shared debt was updated',
      text: `${sender} ${type === 'debt_created' ? 'recorded a debt' : 'updated a debt'} for ${person}: ${debt.direction}, amount ${debt.original_amount}, date ${debt.date}${debt.due_date ? `, due ${debt.due_date}` : ''}.`,
    };
  }
  if (type === 'repayment_submitted') {
    if (payload.direction === 'Borrowed') {
      return {
        subject: 'A payment is awaiting your confirmation',
        text: `${sender} recorded a payment request of ${request?.amount ?? payload.amount} for ${person} on ${request?.payment_date ?? payload.payment_date}. It is pending your confirmation and has not reduced the outstanding balance.`,
      };
    }
    return {
      subject: 'A repayment is awaiting your review',
      text: `${person} submitted a repayment request for ${request?.amount ?? payload.amount} on ${request?.payment_date ?? payload.payment_date}. It is pending approval and has not reduced the outstanding balance.`,
    };
  }
  const decision = payload.decision === 'approved' ? 'approved' : 'rejected';
  return {
    subject: `Repayment ${decision}`,
    text: decision === 'approved'
      ? `A repayment of ${payload.amount} was approved for ${person}. The updated outstanding balance is ${payload.remaining}.`
      : `A repayment for ${person} was rejected.${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}
