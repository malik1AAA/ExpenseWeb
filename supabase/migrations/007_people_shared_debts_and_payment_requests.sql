BEGIN;

CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  email TEXT,
  normalized_email TEXT,
  contact TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  has_linked_account BOOLEAN GENERATED ALWAYS AS (linked_user_id IS NOT NULL) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT people_name_nonempty CHECK (length(trim(name)) > 0),
  CONSTRAINT people_not_linked_to_owner CHECK (linked_user_id IS NULL OR linked_user_id <> owner_user_id),
  CONSTRAINT people_owner_id_unique UNIQUE (owner_user_id, id)
);

CREATE OR REPLACE FUNCTION public.normalize_person_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.name := trim(NEW.name);
  NEW.normalized_name := lower(regexp_replace(trim(NEW.name), '[[:space:]]+', ' ', 'g'));
  NEW.email := NULLIF(trim(NEW.email), '');
  NEW.normalized_email := CASE
    WHEN NEW.email IS NULL THEN NULL
    ELSE lower(NEW.email)
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS people_normalize_fields ON public.people;
CREATE TRIGGER people_normalize_fields
  BEFORE INSERT OR UPDATE OF name, email ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.normalize_person_fields();

CREATE OR REPLACE FUNCTION public.clear_person_link_on_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.normalized_email IS DISTINCT FROM OLD.normalized_email THEN
    NEW.linked_user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS people_z_clear_link_on_email_change ON public.people;
CREATE TRIGGER people_z_clear_link_on_email_change
  BEFORE UPDATE OF email ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.clear_person_link_on_email_change();

DROP TRIGGER IF EXISTS people_set_updated_at ON public.people;
CREATE TRIGGER people_set_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.sync_person_name_to_debts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.debts
    SET person = NEW.name
    WHERE user_id = NEW.owner_user_id AND person_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS people_sync_name_to_debts ON public.people;
CREATE TRIGGER people_sync_name_to_debts
  AFTER UPDATE OF name ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.sync_person_name_to_debts();

CREATE UNIQUE INDEX IF NOT EXISTS people_owner_normalized_name_key
  ON public.people(owner_user_id, normalized_name);
CREATE UNIQUE INDEX IF NOT EXISTS people_owner_normalized_email_key
  ON public.people(owner_user_id, normalized_email)
  WHERE normalized_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS people_linked_user_id_idx
  ON public.people(linked_user_id)
  WHERE linked_user_id IS NOT NULL;

ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS person_id UUID;

INSERT INTO public.people (owner_user_id, name)
SELECT d.user_id, min(trim(d.person))
FROM public.debts d
WHERE d.person IS NOT NULL AND length(trim(d.person)) > 0
GROUP BY d.user_id, lower(regexp_replace(trim(d.person), '[[:space:]]+', ' ', 'g'))
ON CONFLICT (owner_user_id, normalized_name) DO NOTHING;

UPDATE public.debts d
SET person_id = p.id
FROM public.people p
WHERE d.person_id IS NULL
  AND d.user_id = p.owner_user_id
  AND lower(regexp_replace(trim(d.person), '[[:space:]]+', ' ', 'g')) = p.normalized_name
  AND d.person IS NOT NULL
  AND length(trim(d.person)) > 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.debts
    WHERE person IS NOT NULL AND length(trim(person)) > 0 AND person_id IS NULL
  ) THEN
    RAISE EXCEPTION 'People backfill incomplete: at least one named debt has no person_id';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_debt_person()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_active BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.person_id IS NULL THEN
    RAISE EXCEPTION 'A person must be selected for a new debt';
  END IF;
  IF NEW.person_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT owner_user_id, is_active INTO v_owner, v_active
  FROM public.people
  WHERE id = NEW.person_id;
  IF NOT FOUND OR v_owner <> NEW.user_id THEN
    RAISE EXCEPTION 'Person does not belong to the debt owner';
  END IF;
  IF (TG_OP = 'INSERT' OR NEW.person_id IS DISTINCT FROM OLD.person_id) AND NOT v_active THEN
    RAISE EXCEPTION 'Inactive people cannot be assigned to new debts';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS debts_validate_person ON public.debts;
CREATE TRIGGER debts_validate_person
  BEFORE INSERT OR UPDATE OF person_id ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.validate_debt_person();

CREATE INDEX IF NOT EXISTS debts_person_id_idx ON public.debts(person_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'debts_person_owner_fk'
      AND conrelid = 'public.debts'::regclass
  ) THEN
    ALTER TABLE public.debts
      ADD CONSTRAINT debts_person_owner_fk
      FOREIGN KEY (user_id, person_id)
      REFERENCES public.people(owner_user_id, id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.debt_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_pk UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  debt_id TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS debt_payment_requests_one_pending_per_debt
  ON public.debt_payment_requests(debt_pk)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS debt_payment_requests_owner_status_idx
  ON public.debt_payment_requests(owner_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS debt_payment_requests_requester_idx
  ON public.debt_payment_requests(requested_by, status, created_at DESC);
DROP TRIGGER IF EXISTS debt_payment_requests_set_updated_at ON public.debt_payment_requests;
CREATE TRIGGER debt_payment_requests_set_updated_at
  BEFORE UPDATE ON public.debt_payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.person_link_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.debt_notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'debt_created', 'debt_updated', 'repayment_submitted', 'repayment_decided'
  )),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS debt_notification_outbox_actor_pending_idx
  ON public.debt_notification_outbox(actor_user_id, created_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_link_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.person_is_linked_to_current_user(
  p_person_id UUID,
  p_owner_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.people p
    WHERE p.id = p_person_id
      AND p.owner_user_id = p_owner_user_id
      AND p.linked_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.person_is_linked_to_current_user(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_is_linked_to_current_user(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS people_owner_or_linked_read ON public.people;
CREATE POLICY people_owner_read
  ON public.people FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());
DROP POLICY IF EXISTS people_owner_insert ON public.people;
CREATE POLICY people_owner_insert
  ON public.people FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND linked_user_id IS NULL);
DROP POLICY IF EXISTS people_owner_update ON public.people;
CREATE POLICY people_owner_update
  ON public.people FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());
DROP POLICY IF EXISTS people_owner_delete ON public.people;
CREATE POLICY people_owner_delete
  ON public.people FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

REVOKE ALL ON public.people FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, owner_user_id, name, normalized_name, email, contact, is_active,
  has_linked_account, created_at, updated_at
) ON public.people TO authenticated;
GRANT INSERT (owner_user_id, name, email, contact, is_active)
  ON public.people TO authenticated;
GRANT UPDATE (name, email, contact, is_active) ON public.people TO authenticated;
GRANT DELETE ON public.people TO authenticated;

DROP POLICY IF EXISTS debts_shared_read ON public.debts;
CREATE POLICY debts_shared_read
  ON public.debts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.person_is_linked_to_current_user(debts.person_id, debts.user_id)
  );
DROP POLICY IF EXISTS "Users can insert own debts" ON public.debts;
CREATE POLICY "Users can insert own debts"
  ON public.debts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND person_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.people p
      WHERE p.id = debts.person_id
        AND p.owner_user_id = auth.uid()
        AND p.is_active
    )
  );
DROP POLICY IF EXISTS "Users can update own debts" ON public.debts;
CREATE POLICY "Users can update own debts"
  ON public.debts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      person_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.people p
        WHERE p.id = debts.person_id AND p.owner_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS debt_returns_shared_read ON public.debt_returns;
CREATE POLICY debt_returns_shared_read
  ON public.debt_returns FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.debts d
      WHERE d.user_id = debt_returns.user_id
        AND d.debt_id = debt_returns.debt_id
        AND public.person_is_linked_to_current_user(d.person_id, d.user_id)
    )
  );

DROP POLICY IF EXISTS "Users can insert own debt returns" ON public.debt_returns;
CREATE POLICY "Users can insert own debt returns"
  ON public.debt_returns FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.debts d
      WHERE d.user_id = debt_returns.user_id
        AND d.debt_id = debt_returns.debt_id
        AND NOT (
          d.direction = 'Borrowed'
          AND EXISTS (
            SELECT 1 FROM public.people p
            WHERE p.id = d.person_id AND p.owner_user_id = d.user_id
              AND p.has_linked_account
          )
        )
    )
  );

DROP POLICY IF EXISTS debt_payment_requests_authorized_read ON public.debt_payment_requests;
CREATE POLICY debt_payment_requests_authorized_read
  ON public.debt_payment_requests FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR requested_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.debts d
      WHERE d.user_id = debt_payment_requests.owner_user_id
        AND d.debt_id = debt_payment_requests.debt_id
        AND public.person_is_linked_to_current_user(d.person_id, d.user_id)
    )
  );

REVOKE ALL ON public.person_link_invitations FROM anon, authenticated;
REVOKE ALL ON public.debt_notification_outbox FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.debt_payment_requests FROM anon, authenticated;
GRANT SELECT ON public.debt_payment_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.queue_debt_notification(
  p_actor UUID,
  p_recipient UUID,
  p_key TEXT,
  p_type TEXT,
  p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_recipient IS NULL OR p_recipient = p_actor THEN
    RETURN;
  END IF;
  INSERT INTO public.debt_notification_outbox (
    actor_user_id, recipient_user_id, event_key, event_type, payload
  ) VALUES (p_actor, p_recipient, p_key, p_type, p_payload)
  ON CONFLICT (event_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_shared_debt_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_linked_user UUID;
BEGIN
  SELECT linked_user_id INTO v_linked_user
  FROM public.people
  WHERE id = NEW.person_id AND owner_user_id = NEW.user_id;
  IF v_linked_user IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.queue_debt_notification(
      NEW.user_id, v_linked_user, 'debt-created:' || NEW.user_id || ':' || NEW.debt_id,
      'debt_created', jsonb_build_object('debt_id', NEW.debt_id)
    );
  ELSIF ROW(OLD.original_amount, OLD.direction, OLD.date, OLD.due_date, OLD.notes, OLD.person_id)
        IS DISTINCT FROM
        ROW(NEW.original_amount, NEW.direction, NEW.date, NEW.due_date, NEW.notes, NEW.person_id) THEN
    PERFORM public.queue_debt_notification(
      NEW.user_id, v_linked_user,
      'debt-updated:' || NEW.user_id || ':' || NEW.debt_id || ':' || NEW.updated_at::text,
      'debt_updated', jsonb_build_object('debt_id', NEW.debt_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS debts_notify_linked_person ON public.debts;
CREATE TRIGGER debts_notify_linked_person
  AFTER INSERT OR UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.notify_shared_debt_change();

CREATE OR REPLACE FUNCTION public.submit_debt_payment_request(
  p_debt_pk UUID,
  p_amount NUMERIC,
  p_payment_date DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_debt public.debts%ROWTYPE;
  v_linked_user UUID;
  v_outstanding NUMERIC;
  v_request_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF p_payment_date IS NULL THEN RAISE EXCEPTION 'Payment date is required'; END IF;

  SELECT * INTO v_debt
  FROM public.debts
  WHERE id = p_debt_pk
    AND (
      user_id = v_user
      OR EXISTS (
        SELECT 1 FROM public.people p
        WHERE p.id = debts.person_id AND p.owner_user_id = debts.user_id
          AND p.linked_user_id = v_user
      )
    )
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Debt not found or access denied'; END IF;

  SELECT linked_user_id INTO v_linked_user
  FROM public.people
  WHERE id = v_debt.person_id AND owner_user_id = v_debt.user_id;
  IF v_linked_user IS NULL THEN RAISE EXCEPTION 'Debt has no linked participant'; END IF;

  IF (v_debt.direction = 'Lent' AND v_user <> v_linked_user)
     OR (v_debt.direction = 'Borrowed' AND v_user <> v_debt.user_id) THEN
    RAISE EXCEPTION 'Only the party making the repayment can submit this request';
  END IF;

  SELECT v_debt.original_amount - COALESCE(SUM(amount), 0)
  INTO v_outstanding
  FROM public.debt_returns
  WHERE user_id = v_debt.user_id AND debt_id = v_debt.debt_id;
  IF p_amount > v_outstanding THEN RAISE EXCEPTION 'Amount exceeds outstanding balance'; END IF;

  INSERT INTO public.debt_payment_requests (
    debt_pk, debt_id, owner_user_id, requested_by, amount, payment_date, notes
  ) VALUES (
    v_debt.id, v_debt.debt_id, v_debt.user_id, v_user, p_amount, p_payment_date, NULLIF(trim(p_notes), '')
  ) RETURNING id INTO v_request_id;

  PERFORM public.queue_debt_notification(
    v_user, CASE WHEN v_debt.direction = 'Lent' THEN v_debt.user_id ELSE v_linked_user END,
    'payment-submitted:' || v_request_id, 'repayment_submitted',
    jsonb_build_object(
      'request_id', v_request_id, 'debt_id', v_debt.debt_id,
      'owner_user_id', v_debt.user_id, 'direction', v_debt.direction
    )
  );
  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_debt_payment_request(
  p_request_id UUID,
  p_approve BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_request public.debt_payment_requests%ROWTYPE;
  v_debt public.debts%ROWTYPE;
  v_linked_user UUID;
  v_balance NUMERIC;
  v_return_id TEXT;
  v_recipient UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_request
  FROM public.debt_payment_requests
  WHERE id = p_request_id;
  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request not found or is no longer pending';
  END IF;

  SELECT * INTO v_debt
  FROM public.debts
  WHERE id = v_request.debt_pk
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Debt not found'; END IF;

  SELECT * INTO v_request
  FROM public.debt_payment_requests
  WHERE id = p_request_id
  FOR UPDATE;
  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request not found or is no longer pending';
  END IF;

  SELECT linked_user_id INTO v_linked_user
  FROM public.people
  WHERE id = v_debt.person_id AND owner_user_id = v_debt.user_id;

  IF (v_debt.direction = 'Lent' AND v_user <> v_debt.user_id)
     OR (v_debt.direction = 'Borrowed' AND v_user <> v_linked_user) THEN
    RAISE EXCEPTION 'Only the authorized recipient can review this request';
  END IF;
  IF (v_debt.direction = 'Lent' AND v_request.requested_by <> v_linked_user)
     OR (v_debt.direction = 'Borrowed' AND v_request.requested_by <> v_debt.user_id) THEN
    RAISE EXCEPTION 'Request participant is not authorized for this debt';
  END IF;

  IF p_approve THEN
    SELECT v_debt.original_amount - COALESCE(SUM(amount), 0)
    INTO v_balance
    FROM public.debt_returns
    WHERE user_id = v_debt.user_id AND debt_id = v_debt.debt_id;
    IF v_request.amount > v_balance THEN
      RAISE EXCEPTION 'Requested amount now exceeds outstanding balance';
    END IF;

    v_return_id := public.generate_next_return_id_for_user(v_debt.user_id);
    INSERT INTO public.debt_returns (user_id, return_id, debt_id, date, amount, notes)
    VALUES (v_debt.user_id, v_return_id, v_debt.debt_id, v_request.payment_date, v_request.amount, v_request.notes);
    UPDATE public.debt_payment_requests
      SET status = 'approved', reviewed_by = v_user, reviewed_at = NOW(), rejection_reason = NULL
      WHERE id = v_request.id;
  ELSE
    UPDATE public.debt_payment_requests
      SET status = 'rejected', reviewed_by = v_user, reviewed_at = NOW(),
          rejection_reason = NULLIF(trim(p_rejection_reason), '')
      WHERE id = v_request.id;
  END IF;

  v_recipient := CASE
    WHEN v_debt.direction = 'Lent' THEN v_linked_user
    ELSE v_debt.user_id
  END;
  PERFORM public.queue_debt_notification(
    v_user, v_recipient, 'payment-decided:' || v_request.id, 'repayment_decided',
    jsonb_build_object(
      'request_id', v_request.id, 'debt_id', v_debt.debt_id,
      'owner_user_id', v_debt.user_id, 'direction', v_debt.direction,
      'decision', CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      'amount', v_request.amount,
      'remaining', CASE WHEN p_approve THEN v_balance - v_request.amount ELSE NULL END,
      'reason', NULLIF(trim(p_rejection_reason), '')
    )
  );

  RETURN jsonb_build_object(
    'request_id', v_request.id,
    'status', CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    'return_id', v_return_id,
    'remaining', CASE WHEN p_approve THEN v_balance - v_request.amount ELSE NULL END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_repay_person(
  p_person TEXT,
  p_direction TEXT,
  p_debt_category TEXT,
  p_total_amount NUMERIC,
  p_date DATE,
  p_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_outstanding NUMERIC;
  v_remaining_payment NUMERIC;
  v_debt RECORD;
  v_remaining NUMERIC;
  v_allocated NUMERIC;
  v_return_id TEXT;
  v_request_id UUID;
  v_linked_user UUID;
  v_confirmation_required BOOLEAN := FALSE;
  v_allocations JSONB := '[]'::jsonb;
  v_count INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_total_amount IS NULL OR p_total_amount <= 0 THEN RAISE EXCEPTION 'Payment amount must be greater than zero'; END IF;
  IF p_person IS NULL OR trim(p_person) = '' THEN RAISE EXCEPTION 'Person is required'; END IF;
  IF p_direction NOT IN ('Lent', 'Borrowed') THEN RAISE EXCEPTION 'Direction must be Lent or Borrowed'; END IF;
  IF p_debt_category NOT IN ('Food', 'Cash') THEN RAISE EXCEPTION 'Debt category must be Food or Cash'; END IF;
  IF p_date IS NULL THEN RAISE EXCEPTION 'Payment date is required'; END IF;

  PERFORM 1
  FROM public.debts d
  WHERE d.user_id = v_user_id AND d.person = p_person
    AND d.direction = p_direction AND d.debt_category = p_debt_category
  ORDER BY d.date, d.debt_id
  FOR UPDATE;

  SELECT p.linked_user_id INTO v_linked_user
  FROM public.people p
  WHERE p.owner_user_id = v_user_id
    AND p.normalized_name = lower(regexp_replace(trim(p_person), '[[:space:]]+', ' ', 'g'));
  v_confirmation_required := p_direction = 'Borrowed' AND v_linked_user IS NOT NULL;

  SELECT COALESCE(SUM(d.original_amount - COALESCE((
    SELECT SUM(r.amount) FROM public.debt_returns r
    WHERE r.user_id = v_user_id AND r.debt_id = d.debt_id
  ), 0)), 0)
  INTO v_total_outstanding
  FROM public.debts d
  WHERE d.user_id = v_user_id AND d.person = p_person
    AND d.direction = p_direction AND d.debt_category = p_debt_category
    AND d.original_amount - COALESCE((
      SELECT SUM(r.amount) FROM public.debt_returns r
      WHERE r.user_id = v_user_id AND r.debt_id = d.debt_id
    ), 0) > 0;

  IF v_total_outstanding <= 0 THEN RAISE EXCEPTION 'No outstanding debts found for this person'; END IF;
  IF p_total_amount > v_total_outstanding THEN RAISE EXCEPTION 'Payment amount exceeds total outstanding balance'; END IF;
  IF v_confirmation_required AND EXISTS (
    SELECT 1
    FROM public.debt_payment_requests r
    JOIN public.debts d ON d.id = r.debt_pk
    WHERE d.user_id = v_user_id AND d.person = p_person
      AND d.direction = p_direction AND d.debt_category = p_debt_category
      AND r.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A repayment request is already pending for one or more eligible debts';
  END IF;

  v_remaining_payment := p_total_amount;
  FOR v_debt IN
    SELECT d.id, d.debt_id, d.original_amount,
      COALESCE((SELECT SUM(r.amount) FROM public.debt_returns r
        WHERE r.user_id = v_user_id AND r.debt_id = d.debt_id), 0) AS total_returned
    FROM public.debts d
    WHERE d.user_id = v_user_id AND d.person = p_person
      AND d.direction = p_direction AND d.debt_category = p_debt_category
    ORDER BY d.date, d.debt_id
  LOOP
    EXIT WHEN v_remaining_payment <= 0;
    v_remaining := v_debt.original_amount - v_debt.total_returned;
    IF v_remaining <= 0 THEN CONTINUE; END IF;
    v_allocated := LEAST(v_remaining_payment, v_remaining);

    IF v_confirmation_required THEN
      INSERT INTO public.debt_payment_requests (
        debt_pk, debt_id, owner_user_id, requested_by, amount, payment_date, notes
      ) VALUES (
        v_debt.id, v_debt.debt_id, v_user_id, v_user_id, v_allocated, p_date, NULLIF(trim(p_notes), '')
      ) RETURNING id INTO v_request_id;
      PERFORM public.queue_debt_notification(
        v_user_id, v_linked_user, 'payment-submitted:' || v_request_id, 'repayment_submitted',
        jsonb_build_object(
          'request_id', v_request_id, 'debt_id', v_debt.debt_id,
          'owner_user_id', v_user_id, 'direction', p_direction
        )
      );
    ELSE
      v_return_id := public.generate_next_return_id_for_user(v_user_id);
      INSERT INTO public.debt_returns (user_id, return_id, debt_id, date, amount, notes)
      VALUES (v_user_id, v_return_id, v_debt.debt_id, p_date, v_allocated, p_notes);
    END IF;

    v_allocations := v_allocations || jsonb_build_object(
      'debt_id', v_debt.debt_id,
      'allocated', v_allocated,
      'remaining_before', v_remaining,
      'remaining_after', v_remaining - v_allocated,
      'return_id', CASE WHEN v_confirmation_required THEN NULL ELSE v_return_id END,
      'request_id', CASE WHEN v_confirmation_required THEN v_request_id ELSE NULL END
    );
    v_remaining_payment := v_remaining_payment - v_allocated;
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'person', p_person,
    'direction', p_direction,
    'debt_category', p_debt_category,
    'total_paid', p_total_amount,
    'total_outstanding', v_total_outstanding,
    'allocations', v_allocations,
    'allocations_count', v_count,
    'date', p_date,
    'notes', p_notes,
    'confirmation_required', v_confirmation_required
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_person_invitation(p_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_invitation public.person_link_invitations%ROWTYPE;
  v_person public.people%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT lower(email) INTO v_email
  FROM auth.users
  WHERE id = v_user_id AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'A verified email address is required'; END IF;

  SELECT * INTO v_invitation
  FROM public.person_link_invitations
  WHERE token_hash = p_token_hash
    AND accepted_at IS NULL
    AND expires_at > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation is invalid or expired'; END IF;

  SELECT * INTO v_person
  FROM public.people
  WHERE id = v_invitation.person_id
    AND owner_user_id = v_invitation.owner_user_id
  FOR UPDATE;
  IF NOT FOUND OR v_person.normalized_email IS DISTINCT FROM v_email THEN
    RAISE EXCEPTION 'Verified email does not match this invitation';
  END IF;
  IF v_person.linked_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'This person record is already linked';
  END IF;

  UPDATE public.people SET linked_user_id = v_user_id
  WHERE id = v_person.id AND owner_user_id = v_person.owner_user_id
    AND linked_user_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Person record was linked by another account'; END IF;

  UPDATE public.person_link_invitations SET accepted_at = NOW()
  WHERE id = v_invitation.id AND accepted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation was already used'; END IF;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_debt_payment_request(UUID, NUMERIC, DATE, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_debt_payment_request(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accept_person_invitation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_debt_payment_request(UUID, NUMERIC, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_debt_payment_request(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_person_invitation(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.bulk_repay_person(TEXT, TEXT, TEXT, NUMERIC, DATE, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_repay_person(TEXT, TEXT, TEXT, NUMERIC, DATE, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.queue_debt_notification(UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_next_expense_id_for_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_next_debt_id_for_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_next_return_id_for_user(UUID) FROM PUBLIC, anon, authenticated;

COMMIT;
