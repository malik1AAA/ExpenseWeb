import { supabase } from '../lib/supabaseClient';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const invokeFunction = async (name, options) => {
  const { data, error } = await supabase.functions.invoke(name, options);
  if (!error) return data;

  let message = error.message;
  if (error.context && typeof error.context.clone === 'function') {
    try {
      const responseBody = await error.context.clone().json();
      if (typeof responseBody?.error === 'string') message = responseBody.error;
    } catch {
      // Keep the Functions client error when the response has no JSON body.
    }
  }
  throw new Error(message || `The ${name} function request failed.`);
};

const validatePerson = (person) => {
  const name = String(person.name || '').trim();
  const email = String(person.email || '').trim();

  if (!name) throw new Error('Person name is required');
  if (email && !EMAIL_PATTERN.test(email)) throw new Error('Enter a valid email address');

  return {
    name,
    email: email || null,
    contact: String(person.contact || '').trim() || null,
    is_active: person.is_active !== false,
  };
};

export const fetchPeople = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('people')
    .select('id, name, email, contact, is_active, has_linked_account, created_at, updated_at')
    .eq('owner_user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const createPerson = async (person) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('people')
    .insert({ owner_user_id: user.id, ...validatePerson(person) })
    .select('id, name, email, contact, is_active, has_linked_account, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

export const getOrCreatePersonForImport = async (rawName) => {
  const name = String(rawName || '').trim();
  if (!name) throw new Error('Imported debt is missing a person name.');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('User not authenticated');

  const normalizedName = name.toLowerCase().replace(/\s+/g, ' ');
  const { data: existing, error: lookupError } = await supabase
    .from('people')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('normalized_name', normalizedName)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('people')
    .insert({ owner_user_id: user.id, name })
    .select('id')
    .single();
  if (createError) throw createError;
  return created.id;
};

export const updatePerson = async (personId, person) => {
  const { data, error } = await supabase
    .from('people')
    .update(validatePerson(person))
    .eq('id', personId)
    .select('id, name, email, contact, is_active, has_linked_account, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

export const invitePerson = async (personId) => {
  return invokeFunction('invite-person', {
    body: { personId },
  });
};

export const flushDebtNotifications = async () => {
  return invokeFunction('send-debt-notifications', {
    body: {},
  });
};

export const fetchDebtPaymentRequests = async () => {
  const { data, error } = await supabase
    .from('debt_payment_requests')
    .select('id, debt_pk, debt_id, amount, payment_date, notes, status, reviewed_at, rejection_reason, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const submitDebtPaymentRequest = async ({ debtPk, amount, paymentDate, notes }) => {
  const { data, error } = await supabase.rpc('submit_debt_payment_request', {
    p_debt_pk: debtPk,
    p_amount: amount,
    p_payment_date: paymentDate,
    p_notes: notes || null,
  });

  if (error) throw error;
  return data;
};

export const reviewDebtPaymentRequest = async (requestId, approve, rejectionReason = '') => {
  const { data, error } = await supabase.rpc('review_debt_payment_request', {
    p_request_id: requestId,
    p_approve: approve,
    p_rejection_reason: rejectionReason || null,
  });

  if (error) throw error;
  return data;
};
