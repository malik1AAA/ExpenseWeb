import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeadersForRequest, jsonResponse, sha256 } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersForRequest(request) });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Authentication required' }, 401, request);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Authentication required' }, 401, request);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await request.json();
    if (body.action === 'accept') {
      if (!user.email || !user.email_confirmed_at) {
        return jsonResponse({ error: 'Sign in with the verified email invited to link this record.' }, 403, request);
      }
      if (typeof body.token !== 'string' || body.token.length < 32 || body.token.length > 200) {
        return jsonResponse({ error: 'Invitation token is invalid.' }, 400, request);
      }
      const { error } = await callerClient.rpc('accept_person_invitation', {
        p_token_hash: await sha256(body.token),
      });
      if (error) return jsonResponse({ error: error.message }, 400, request);
      return jsonResponse({ success: true }, 200, request);
    }

    if (typeof body.personId !== 'string') return jsonResponse({ error: 'Person ID is required.' }, 400, request);
    const { data: person, error: personError } = await admin
      .from('people')
      .select('id, owner_user_id, name, email, linked_user_id')
      .eq('id', body.personId)
      .eq('owner_user_id', user.id)
      .maybeSingle();
    if (personError) throw personError;
    if (!person || !person.email) return jsonResponse({ error: 'Person not found or has no email.' }, 404, request);
    if (person.linked_user_id) return jsonResponse({ error: 'This person already has a linked account.' }, 409, request);

    const emailFrom = Deno.env.get('EMAIL_FROM') || 'ExpenseWeb';
    const mailerSecret = Deno.env.get('SMTP_MAILER_SECRET');
    const mailerUrl = Deno.env.get('SMTP_MAILER_URL');
    const appUrl = Deno.env.get('APP_URL');
    if (!mailerSecret || !mailerUrl || !appUrl) {
      return jsonResponse({ error: 'Email service is not configured. Set SMTP_MAILER_URL, SMTP_MAILER_SECRET, and APP_URL in Supabase.' }, 503, request);
    }

    const token = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-', '')}`;
    const tokenHash = await sha256(token);
    const { data: invitation, error: inviteError } = await admin
      .from('person_link_invitations')
      .insert({
        person_id: person.id,
        owner_user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();
    if (inviteError) throw inviteError;

    const inviterName = String(user.user_metadata?.full_name || user.user_metadata?.name || 'An ExpenseWeb user');
    const inviteUrl = new URL('/link-person', appUrl);
    inviteUrl.searchParams.set('token', token);
    const emailResponse = await fetch(mailerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mailerSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [person.email],
        subject: 'Link your ExpenseWeb account',
        text: `${inviterName} invited you to securely link an ExpenseWeb account to the contact "${person.name}". Sign in with this email address and confirm the invitation: ${inviteUrl.toString()}. This link expires in 7 days.`,
        html: `<p>${escapeHtml(inviterName)} invited you to securely link your ExpenseWeb account to the contact <strong>${escapeHtml(person.name)}</strong>.</p><p>Sign in with this email address and <a href="${escapeHtml(inviteUrl.toString())}">confirm the invitation</a>. The link expires in 7 days.</p>`,
      }),
    });

    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      await admin.from('person_link_invitations').delete().eq('id', invitation.id);
      console.error('Invitation email delivery failed:', details);
      let message = 'Invitation email could not be delivered.';
      try {
        const responseBody = JSON.parse(details);
        if (typeof responseBody.error === 'string') message = responseBody.error;
      } catch {
        // Keep the generic delivery error when the mail service did not return JSON.
      }
      return jsonResponse({ error: message }, 502, request);
    }

    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error('Person invitation failed:', error);
    return jsonResponse({ error: 'Could not process the person invitation.' }, 500, request);
  }
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}
