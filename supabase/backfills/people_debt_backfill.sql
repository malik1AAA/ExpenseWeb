-- Run after migration 007_people_shared_debts_and_payment_requests.sql.
-- Safe to rerun: one People row is reused per owner and normalized name.
BEGIN;

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
DECLARE
  v_unlinked BIGINT;
  v_wrong_owner BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_unlinked
  FROM public.debts
  WHERE person IS NOT NULL AND length(trim(person)) > 0 AND person_id IS NULL;

  SELECT COUNT(*) INTO v_wrong_owner
  FROM public.debts d
  LEFT JOIN public.people p ON p.id = d.person_id
  WHERE d.person_id IS NOT NULL
    AND (p.id IS NULL OR p.owner_user_id <> d.user_id);

  IF v_unlinked > 0 OR v_wrong_owner > 0 THEN
    RAISE EXCEPTION 'Backfill validation failed: % named debts unlinked, % debts linked to another owner',
      v_unlinked, v_wrong_owner;
  END IF;
END;
$$;

COMMIT;

-- Verification report: both counts should be zero.
SELECT
  COUNT(*) FILTER (
    WHERE d.person IS NOT NULL AND length(trim(d.person)) > 0 AND d.person_id IS NULL
  ) AS named_debts_without_person_id,
  COUNT(*) FILTER (
    WHERE d.person_id IS NOT NULL AND (p.id IS NULL OR p.owner_user_id <> d.user_id)
  ) AS invalid_or_cross_owner_person_references
FROM public.debts d
LEFT JOIN public.people p ON p.id = d.person_id;

-- Number of resulting person records, grouped by debt owner.
SELECT owner_user_id, COUNT(*) AS people_count
FROM public.people
GROUP BY owner_user_id
ORDER BY owner_user_id;
