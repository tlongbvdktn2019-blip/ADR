-- Professional allergy-card issuance, organization scoping, public QR and review workflow.
-- This migration is intentionally additive. Legacy update tables remain available during rollout.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES departments(id);
ALTER TABLE adr_reports ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES departments(id);
ALTER TABLE allergy_cards ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES departments(id);
ALTER TABLE allergy_cards ADD COLUMN IF NOT EXISTS source_report_updated_at TIMESTAMPTZ;
ALTER TABLE allergy_cards ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid();
ALTER TABLE allergy_cards ADD COLUMN IF NOT EXISTS doctor_source VARCHAR(20) DEFAULT 'manual';

ALTER TABLE allergy_cards ALTER COLUMN qr_code_data DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'allergy_cards_doctor_source_check'
  ) THEN
    ALTER TABLE allergy_cards
      ADD CONSTRAINT allergy_cards_doctor_source_check
      CHECK (doctor_source IN ('reporter', 'manual'));
  END IF;
END $$;

-- Canonical aliases found during the read-only production audit.
WITH aliases(source_name, canonical_name) AS (
  VALUES
    ('Bệnh viện Da liễu Cần Thơ', 'Bệnh viện Da liễu Thành phố Cần Thơ'),
    ('Bệnh viện Huyết học - Truyền máu Cần Thơ', 'Bệnh viện Huyết học Truyền máu Cần Thơ'),
    ('Bệnh viện Lao và Bệnh phổi thành phố Cần Thơ', 'Bệnh viện Lao và Bệnh phổi Cần Thơ'),
    ('Bệnh viện Phụ sản Cần Thơ', 'Bệnh viện Phụ sản thành phố Cần Thơ'),
    ('Bệnh viện Quân Dân Y TP Cần Thơ', 'Bệnh viện Quân Dân Y thành phố Cần Thơ'),
    ('Trung tâm Y tế khu vực Kế sách ', 'Trung tâm Y tế khu vực Kế sách')
)
UPDATE users u
SET organization_id = d.id
FROM aliases a
JOIN departments d ON lower(btrim(d.name)) = lower(btrim(a.canonical_name))
WHERE lower(btrim(u.organization)) = lower(btrim(a.source_name));

UPDATE users u
SET organization_id = d.id
FROM departments d
WHERE u.organization_id IS NULL
  AND lower(regexp_replace(btrim(u.organization), '\s+', ' ', 'g')) =
      lower(regexp_replace(btrim(d.name), '\s+', ' ', 'g'));

WITH aliases(source_name, canonical_name) AS (
  VALUES
    ('Bệnh viện Da liễu Cần Thơ', 'Bệnh viện Da liễu Thành phố Cần Thơ'),
    ('Bệnh viện Huyết học - Truyền máu Cần Thơ', 'Bệnh viện Huyết học Truyền máu Cần Thơ'),
    ('Bệnh viện Lao và Bệnh phổi thành phố Cần Thơ', 'Bệnh viện Lao và Bệnh phổi Cần Thơ'),
    ('Bệnh viện Phụ sản Cần Thơ', 'Bệnh viện Phụ sản thành phố Cần Thơ'),
    ('Bệnh viện Quân Dân Y TP Cần Thơ', 'Bệnh viện Quân Dân Y thành phố Cần Thơ'),
    ('Trung tâm Y tế khu vực Kế sách ', 'Trung tâm Y tế khu vực Kế sách')
)
UPDATE adr_reports r
SET organization_id = d.id
FROM aliases a
JOIN departments d ON lower(btrim(d.name)) = lower(btrim(a.canonical_name))
WHERE lower(btrim(r.organization)) = lower(btrim(a.source_name));

UPDATE adr_reports r
SET organization_id = d.id
FROM departments d
WHERE r.organization_id IS NULL
  AND lower(regexp_replace(btrim(r.organization), '\s+', ' ', 'g')) =
      lower(regexp_replace(btrim(d.name), '\s+', ' ', 'g'));

UPDATE allergy_cards c
SET organization_id = r.organization_id,
    source_report_updated_at = COALESCE(c.source_report_updated_at, r.updated_at)
FROM adr_reports r
WHERE c.report_id = r.id
  AND (c.organization_id IS NULL OR c.source_report_updated_at IS NULL);

UPDATE allergy_cards c
SET organization_id = d.id
FROM departments d
WHERE c.organization_id IS NULL
  AND lower(regexp_replace(btrim(c.organization), '\s+', ' ', 'g')) =
      lower(regexp_replace(btrim(d.name), '\s+', ' ', 'g'));

DO $$
DECLARE
  missing_reports INTEGER;
  missing_users INTEGER;
  missing_cards INTEGER;
BEGIN
  SELECT count(*) INTO missing_reports FROM adr_reports WHERE organization_id IS NULL;
  SELECT count(*) INTO missing_users FROM users WHERE role <> 'admin' AND organization_id IS NULL;
  SELECT count(*) INTO missing_cards FROM allergy_cards WHERE organization_id IS NULL;

  IF missing_reports > 0 OR missing_users > 0 OR missing_cards > 0 THEN
    RAISE EXCEPTION
      'Organization backfill incomplete: % reports, % non-admin users, % cards',
      missing_reports, missing_users, missing_cards;
  END IF;
END $$;

ALTER TABLE adr_reports ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE allergy_cards ALTER COLUMN organization_id SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_organization_required_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_organization_required_check
      CHECK (role = 'admin' OR organization_id IS NOT NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_allergy_cards_report_id
  ON allergy_cards(report_id) WHERE report_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_allergy_cards_public_token
  ON allergy_cards(public_token);
CREATE INDEX IF NOT EXISTS idx_allergy_cards_organization_id
  ON allergy_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_adr_reports_organization_id
  ON adr_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id
  ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_allergy_cards_expiry_date
  ON allergy_cards(expiry_date);

ALTER TABLE card_allergies ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'report';
ALTER TABLE card_allergies ADD COLUMN IF NOT EXISTS source_report_drug_id UUID REFERENCES suspected_drugs(id) ON DELETE SET NULL;
ALTER TABLE card_allergies ADD COLUMN IF NOT EXISTS source_update_item_id UUID;
ALTER TABLE card_allergies ADD COLUMN IF NOT EXISTS normalized_name TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'card_allergies_source_type_check'
  ) THEN
    ALTER TABLE card_allergies
      ADD CONSTRAINT card_allergies_source_type_check
      CHECK (source_type IN ('report', 'manual_missing', 'public_update'));
  END IF;
END $$;

UPDATE card_allergies
SET normalized_name = lower(regexp_replace(btrim(allergen_name), '\s+', ' ', 'g'))
WHERE normalized_name IS NULL;

ALTER TABLE card_allergies ALTER COLUMN normalized_name SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_card_allergies_normalized_name
  ON card_allergies(card_id, normalized_name);

CREATE TABLE IF NOT EXISTS allergy_card_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID,
  card_code VARCHAR(20) NOT NULL,
  organization_id UUID REFERENCES departments(id),
  action VARCHAR(40) NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'public_token_rotated',
    'update_submitted', 'update_item_approved', 'update_item_rejected'
  )),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allergy_card_audit_card ON allergy_card_audit_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_allergy_card_audit_org ON allergy_card_audit_logs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS allergy_card_update_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES allergy_cards(id) ON DELETE CASCADE,
  updated_by_name VARCHAR(255) NOT NULL,
  updated_by_organization VARCHAR(255) NOT NULL,
  updated_by_role VARCHAR(100) NOT NULL,
  updated_by_phone VARCHAR(20),
  updated_by_email VARCHAR(255),
  facility_name VARCHAR(255) NOT NULL,
  facility_department VARCHAR(255),
  reason_for_update TEXT NOT NULL,
  submission_notes TEXT,
  review_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
    review_status IN ('pending', 'partially_approved', 'approved', 'rejected')
  ),
  captcha_verified_at TIMESTAMPTZ NOT NULL,
  submitted_ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS allergy_card_update_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES allergy_card_update_submissions(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('new_allergy', 'modify_allergy', 'additional_note')),
  target_allergy_id UUID REFERENCES card_allergies(id) ON DELETE SET NULL,
  allergen_name VARCHAR(255),
  certainty_level VARCHAR(20) CHECK (certainty_level IN ('suspected', 'confirmed')),
  clinical_manifestation TEXT,
  severity_level VARCHAR(30) CHECK (severity_level IN ('mild', 'moderate', 'severe', 'life_threatening')),
  reaction_type VARCHAR(100),
  discovered_date DATE,
  note TEXT,
  normalized_name TEXT,
  review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  applied_card_allergy_id UUID REFERENCES card_allergies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allergy_update_submissions_card
  ON allergy_card_update_submissions(card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allergy_update_submissions_status
  ON allergy_card_update_submissions(review_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allergy_update_items_submission
  ON allergy_card_update_items(submission_id, review_status);

ALTER TABLE card_allergies
  DROP CONSTRAINT IF EXISTS card_allergies_source_update_item_id_fkey;
ALTER TABLE card_allergies
  ADD CONSTRAINT card_allergies_source_update_item_id_fkey
  FOREIGN KEY (source_update_item_id) REFERENCES allergy_card_update_items(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS allergy_card_public_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES allergy_cards(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allergy_public_rate_card_ip
  ON allergy_card_public_rate_limits(card_id, ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allergy_public_rate_ip
  ON allergy_card_public_rate_limits(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allergy_public_rate_created_at
  ON allergy_card_public_rate_limits(created_at);

-- All access goes through authenticated server routes or the guarded public endpoint.
-- Service-role clients bypass RLS; browser/anon clients receive no direct table access.
ALTER TABLE allergy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_card_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_card_update_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_card_update_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_card_public_rate_limits ENABLE ROW LEVEL SECURITY;

-- Extend the notification event vocabulary without replacing existing rows.
-- Production uses an enum while older/local schemas use TEXT + CHECK, so support both.
DO $$
DECLARE
  v_type_kind "char";
  v_type_schema TEXT;
  v_type_name TEXT;
BEGIN
  SELECT t.typtype, ns.nspname, t.typname
  INTO v_type_kind, v_type_schema, v_type_name
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace table_ns ON table_ns.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
  JOIN pg_namespace ns ON ns.oid = t.typnamespace
  WHERE table_ns.nspname = 'public'
    AND c.relname = 'notifications'
    AND a.attname = 'type'
    AND a.attnum > 0
    AND NOT a.attisdropped;

  IF v_type_kind = 'e' THEN
    EXECUTE format('ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L', v_type_schema, v_type_name, 'allergy_update_submitted');
    EXECUTE format('ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L', v_type_schema, v_type_name, 'allergy_update_reviewed');
  ELSE
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
      type IN (
        'new_report', 'report_updated', 'system',
        'allergy_update_submitted', 'allergy_update_reviewed'
      )
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION issue_allergy_card(
  p_report_id UUID,
  p_issued_by UUID,
  p_organization_id UUID,
  p_expected_report_updated_at TIMESTAMPTZ,
  p_card JSONB,
  p_allergies JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report adr_reports%ROWTYPE;
  v_user users%ROWTYPE;
  v_card_id UUID;
  v_card_code VARCHAR(20);
  v_allergy JSONB;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_issued_by;
  IF NOT FOUND THEN RAISE EXCEPTION 'ISSUER_NOT_FOUND'; END IF;

  SELECT * INTO v_report FROM adr_reports WHERE id = p_report_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'REPORT_NOT_FOUND'; END IF;

  IF v_user.role <> 'admin' AND v_user.organization_id IS DISTINCT FROM v_report.organization_id THEN
    RAISE EXCEPTION 'REPORT_FORBIDDEN';
  END IF;
  IF p_organization_id IS DISTINCT FROM v_report.organization_id THEN
    RAISE EXCEPTION 'ORGANIZATION_MISMATCH';
  END IF;
  IF v_report.updated_at IS DISTINCT FROM p_expected_report_updated_at THEN
    RAISE EXCEPTION 'REPORT_STALE';
  END IF;
  IF EXISTS (SELECT 1 FROM allergy_cards WHERE report_id = p_report_id) THEN
    RAISE EXCEPTION 'REPORT_ALREADY_ISSUED';
  END IF;

  INSERT INTO allergy_cards (
    report_id, patient_name, patient_gender, patient_age, patient_id_number,
    hospital_name, department, doctor_name, doctor_phone, issued_date,
    expiry_date, issued_by_user_id, organization, organization_id,
    source_report_updated_at, doctor_source, notes, status, public_token
  ) VALUES (
    p_report_id, p_card->>'patient_name', p_card->>'patient_gender',
    (p_card->>'patient_age')::INTEGER, NULLIF(p_card->>'patient_id_number', ''),
    p_card->>'hospital_name', NULLIF(p_card->>'department', ''),
    p_card->>'doctor_name', NULLIF(p_card->>'doctor_phone', ''),
    (p_card->>'issued_date')::DATE, NULLIF(p_card->>'expiry_date', '')::DATE,
    p_issued_by, v_report.organization, v_report.organization_id,
    v_report.updated_at, p_card->>'doctor_source', NULLIF(p_card->>'notes', ''),
    'active', gen_random_uuid()
  ) RETURNING id, card_code INTO v_card_id, v_card_code;

  FOR v_allergy IN SELECT * FROM jsonb_array_elements(p_allergies)
  LOOP
    INSERT INTO card_allergies (
      card_id, allergen_name, normalized_name, certainty_level,
      clinical_manifestation, severity_level, reaction_type,
      source_type, source_report_drug_id
    ) VALUES (
      v_card_id, v_allergy->>'allergen_name', v_allergy->>'normalized_name',
      v_allergy->>'certainty_level', NULLIF(v_allergy->>'clinical_manifestation', ''),
      NULLIF(v_allergy->>'severity_level', ''), NULLIF(v_allergy->>'reaction_type', ''),
      v_allergy->>'source_type', NULLIF(v_allergy->>'source_report_drug_id', '')::UUID
    );
  END LOOP;

  INSERT INTO allergy_card_audit_logs (
    card_id, card_code, organization_id, action, actor_user_id, new_values
  ) VALUES (
    v_card_id, v_card_code, v_report.organization_id, 'created', p_issued_by,
    jsonb_build_object('report_id', p_report_id, 'card', p_card, 'allergies', p_allergies)
  );

  RETURN v_card_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'REPORT_ALREADY_ISSUED';
END;
$$;

CREATE OR REPLACE FUNCTION delete_allergy_card(
  p_card_id UUID,
  p_actor_user_id UUID,
  p_expected_card_code TEXT,
  p_reason TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card allergy_cards%ROWTYPE;
  v_user users%ROWTYPE;
  v_snapshot JSONB;
BEGIN
  IF length(btrim(COALESCE(p_reason, ''))) < 5 THEN
    RAISE EXCEPTION 'DELETE_REASON_REQUIRED';
  END IF;

  SELECT * INTO v_user FROM users WHERE id = p_actor_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTOR_NOT_FOUND'; END IF;
  SELECT * INTO v_card FROM allergy_cards WHERE id = p_card_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CARD_NOT_FOUND'; END IF;

  IF v_user.role <> 'admin' AND v_user.organization_id IS DISTINCT FROM v_card.organization_id THEN
    RAISE EXCEPTION 'CARD_FORBIDDEN';
  END IF;
  IF upper(btrim(p_expected_card_code)) IS DISTINCT FROM upper(v_card.card_code) THEN
    RAISE EXCEPTION 'CARD_CODE_MISMATCH';
  END IF;

  SELECT to_jsonb(v_card) || jsonb_build_object(
    'allergies', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM card_allergies a WHERE a.card_id = v_card.id), '[]'::jsonb),
    'update_submissions', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM allergy_card_update_submissions s WHERE s.card_id = v_card.id), '[]'::jsonb),
    'update_items', COALESCE((
      SELECT jsonb_agg(to_jsonb(i))
      FROM allergy_card_update_items i
      JOIN allergy_card_update_submissions s ON s.id = i.submission_id
      WHERE s.card_id = v_card.id
    ), '[]'::jsonb)
  ) INTO v_snapshot;

  INSERT INTO allergy_card_audit_logs (
    card_id, card_code, organization_id, action, actor_user_id, reason, old_values
  ) VALUES (
    v_card.id, v_card.card_code, v_card.organization_id, 'deleted',
    p_actor_user_id, btrim(p_reason), v_snapshot
  );

  DELETE FROM allergy_cards WHERE id = v_card.id;
  RETURN v_card.report_id;
END;
$$;

CREATE OR REPLACE FUNCTION submit_allergy_card_update(
  p_card_id UUID,
  p_ip_hash TEXT,
  p_submission JSONB,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card allergy_cards%ROWTYPE;
  v_submission_id UUID;
  v_item JSONB;
BEGIN
  SELECT * INTO v_card FROM allergy_cards WHERE id = p_card_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CARD_NOT_FOUND'; END IF;
  IF v_card.status <> 'active' OR (
    v_card.expiry_date IS NOT NULL AND
    v_card.expiry_date < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
  ) THEN
    RAISE EXCEPTION 'CARD_NOT_ACTIVE';
  END IF;
  -- Serialize attempts from the same privacy-preserving IP hash so concurrent
  -- requests cannot bypass the counters.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  DELETE FROM allergy_card_public_rate_limits WHERE created_at < now() - INTERVAL '2 days';
  IF (
    SELECT count(*) FROM allergy_card_public_rate_limits
    WHERE card_id = p_card_id AND ip_hash = p_ip_hash AND created_at >= now() - INTERVAL '1 hour'
  ) >= 5 OR (
    SELECT count(*) FROM allergy_card_public_rate_limits
    WHERE ip_hash = p_ip_hash AND created_at >= now() - INTERVAL '1 day'
  ) >= 20 THEN
    RAISE EXCEPTION 'RATE_LIMITED';
  END IF;

  INSERT INTO allergy_card_public_rate_limits(card_id, ip_hash) VALUES (p_card_id, p_ip_hash);
  INSERT INTO allergy_card_update_submissions (
    card_id, updated_by_name, updated_by_organization, updated_by_role,
    updated_by_phone, updated_by_email, facility_name, facility_department,
    reason_for_update, submission_notes, captcha_verified_at, submitted_ip_hash
  ) VALUES (
    p_card_id, p_submission->>'updated_by_name', p_submission->>'updated_by_organization',
    p_submission->>'updated_by_role', NULLIF(p_submission->>'updated_by_phone', ''),
    NULLIF(p_submission->>'updated_by_email', ''), p_submission->>'facility_name',
    NULLIF(p_submission->>'facility_department', ''), p_submission->>'reason_for_update',
    NULLIF(p_submission->>'submission_notes', ''), now(), p_ip_hash
  ) RETURNING id INTO v_submission_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO allergy_card_update_items (
      submission_id, item_type, target_allergy_id, allergen_name,
      certainty_level, clinical_manifestation, severity_level, reaction_type,
      discovered_date, note, normalized_name
    ) VALUES (
      v_submission_id, v_item->>'item_type', NULLIF(v_item->>'target_allergy_id', '')::UUID,
      NULLIF(v_item->>'allergen_name', ''), NULLIF(v_item->>'certainty_level', ''),
      NULLIF(v_item->>'clinical_manifestation', ''), NULLIF(v_item->>'severity_level', ''),
      NULLIF(v_item->>'reaction_type', ''), NULLIF(v_item->>'discovered_date', '')::DATE,
      NULLIF(v_item->>'note', ''), NULLIF(v_item->>'normalized_name', '')
    );
  END LOOP;

  INSERT INTO allergy_card_audit_logs (
    card_id, card_code, organization_id, action, reason, new_values
  ) VALUES (
    v_card.id, v_card.card_code, v_card.organization_id, 'update_submitted',
    p_submission->>'reason_for_update', jsonb_build_object('submission_id', v_submission_id)
  );
  RETURN v_submission_id;
END;
$$;

CREATE OR REPLACE FUNCTION review_allergy_card_update_item(
  p_item_id UUID,
  p_actor_user_id UUID,
  p_decision TEXT,
  p_review_note TEXT,
  p_merge_target_allergy_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item allergy_card_update_items%ROWTYPE;
  v_submission allergy_card_update_submissions%ROWTYPE;
  v_card allergy_cards%ROWTYPE;
  v_user users%ROWTYPE;
  v_applied_id UUID;
  v_pending INTEGER;
  v_approved INTEGER;
  v_rejected INTEGER;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'INVALID_REVIEW_DECISION'; END IF;
  IF p_decision = 'rejected' AND length(btrim(COALESCE(p_review_note, ''))) < 3 THEN
    RAISE EXCEPTION 'REVIEW_NOTE_REQUIRED';
  END IF;

  SELECT * INTO v_item FROM allergy_card_update_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'UPDATE_ITEM_NOT_FOUND'; END IF;
  IF v_item.review_status <> 'pending' THEN RAISE EXCEPTION 'UPDATE_ITEM_ALREADY_REVIEWED'; END IF;
  SELECT * INTO v_submission FROM allergy_card_update_submissions WHERE id = v_item.submission_id;
  SELECT * INTO v_card FROM allergy_cards WHERE id = v_submission.card_id;
  SELECT * INTO v_user FROM users WHERE id = p_actor_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTOR_NOT_FOUND'; END IF;
  IF v_user.role <> 'admin' AND v_user.organization_id IS DISTINCT FROM v_card.organization_id THEN
    RAISE EXCEPTION 'CARD_FORBIDDEN';
  END IF;

  IF p_decision = 'approved' AND v_item.item_type IN ('new_allergy', 'modify_allergy') THEN
    IF v_item.item_type = 'modify_allergy' THEN
      v_applied_id := v_item.target_allergy_id;
    ELSE
      v_applied_id := p_merge_target_allergy_id;
      IF v_applied_id IS NULL AND EXISTS (
        SELECT 1 FROM card_allergies
        WHERE card_id = v_card.id AND normalized_name = v_item.normalized_name
      ) THEN
        RAISE EXCEPTION 'DUPLICATE_ALLERGEN_REQUIRES_MERGE';
      END IF;
    END IF;

    IF v_applied_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM card_allergies WHERE id = v_applied_id AND card_id = v_card.id) THEN
        RAISE EXCEPTION 'MERGE_TARGET_INVALID';
      END IF;
      UPDATE card_allergies SET
        allergen_name = COALESCE(v_item.allergen_name, allergen_name),
        normalized_name = COALESCE(v_item.normalized_name, normalized_name),
        certainty_level = COALESCE(v_item.certainty_level, certainty_level),
        clinical_manifestation = COALESCE(v_item.clinical_manifestation, clinical_manifestation),
        severity_level = COALESCE(v_item.severity_level, severity_level),
        reaction_type = COALESCE(v_item.reaction_type, reaction_type),
        source_update_item_id = v_item.id,
        updated_at = now()
      WHERE id = v_applied_id;
    ELSE
      INSERT INTO card_allergies (
        card_id, allergen_name, normalized_name, certainty_level,
        clinical_manifestation, severity_level, reaction_type,
        source_type, source_update_item_id
      ) VALUES (
        v_card.id, v_item.allergen_name, v_item.normalized_name,
        COALESCE(v_item.certainty_level, 'suspected'), v_item.clinical_manifestation,
        v_item.severity_level, v_item.reaction_type, 'public_update', v_item.id
      ) RETURNING id INTO v_applied_id;
    END IF;
  END IF;

  UPDATE allergy_card_update_items SET
    review_status = p_decision,
    reviewed_by_user_id = p_actor_user_id,
    reviewed_at = now(),
    review_note = NULLIF(btrim(COALESCE(p_review_note, '')), ''),
    applied_card_allergy_id = v_applied_id,
    updated_at = now()
  WHERE id = v_item.id;

  SELECT
    count(*) FILTER (WHERE review_status = 'pending'),
    count(*) FILTER (WHERE review_status = 'approved'),
    count(*) FILTER (WHERE review_status = 'rejected')
  INTO v_pending, v_approved, v_rejected
  FROM allergy_card_update_items WHERE submission_id = v_submission.id;

  UPDATE allergy_card_update_submissions SET
    review_status = CASE
      WHEN v_pending > 0 AND (v_approved > 0 OR v_rejected > 0) THEN 'partially_approved'
      WHEN v_pending > 0 THEN 'pending'
      WHEN v_approved > 0 AND v_rejected > 0 THEN 'partially_approved'
      WHEN v_approved > 0 THEN 'approved'
      ELSE 'rejected'
    END,
    updated_at = now()
  WHERE id = v_submission.id;

  INSERT INTO allergy_card_audit_logs (
    card_id, card_code, organization_id, action, actor_user_id, reason, new_values
  ) VALUES (
    v_card.id, v_card.card_code, v_card.organization_id,
    CASE WHEN p_decision = 'approved' THEN 'update_item_approved' ELSE 'update_item_rejected' END,
    p_actor_user_id, p_review_note,
    jsonb_build_object('submission_id', v_submission.id, 'item_id', v_item.id, 'applied_card_allergy_id', v_applied_id)
  );

  RETURN v_item.id;
END;
$$;

REVOKE ALL ON FUNCTION issue_allergy_card(UUID, UUID, UUID, TIMESTAMPTZ, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_allergy_card(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION submit_allergy_card_update(UUID, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION review_allergy_card_update_item(UUID, UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION issue_allergy_card(UUID, UUID, UUID, TIMESTAMPTZ, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION delete_allergy_card(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION submit_allergy_card_update(UUID, TEXT, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION review_allergy_card_update_item(UUID, UUID, TEXT, TEXT, UUID) TO service_role;
