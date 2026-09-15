-- Rebuild AI Consultant for per-drug, reviewable and auditable assessments.

ALTER TABLE public.suspected_drugs
  ADD COLUMN IF NOT EXISTS client_ref UUID DEFAULT gen_random_uuid();

UPDATE public.suspected_drugs
SET client_ref = gen_random_uuid()
WHERE client_ref IS NULL;

ALTER TABLE public.suspected_drugs
  ALTER COLUMN client_ref SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_suspected_drugs_report_client_ref
  ON public.suspected_drugs(report_id, client_ref);

CREATE TABLE IF NOT EXISTS public.ai_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.adr_reports(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('internal', 'public')),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  public_session_hash TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN (
      'created', 'retrieving_evidence', 'evidence_ready', 'structuring',
      'ready', 'reviewed', 'failed', 'stale'
    )
  ),
  context_snapshot JSONB NOT NULL,
  context_hash TEXT NOT NULL,
  evidence_packet JSONB,
  result JSONB,
  model_id TEXT NOT NULL DEFAULT 'gemini-2.5-pro',
  prompt_version TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  CHECK (
    (actor_type = 'internal' AND user_id IS NOT NULL) OR
    (actor_type = 'public' AND public_session_hash IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.ai_evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.ai_consultations(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  quality_tier SMALLINT NOT NULL CHECK (quality_tier BETWEEN 1 AND 4),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  grounding_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  claim_summary TEXT,
  UNIQUE (consultation_id, source_key)
);

CREATE TABLE IF NOT EXISTS public.ai_drug_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.ai_consultations(id) ON DELETE CASCADE,
  drug_client_ref UUID NOT NULL,
  -- Keep the immutable assessment snapshot when a report edit replaces drug rows.
  suspected_drug_id UUID REFERENCES public.suspected_drugs(id) ON DELETE SET NULL,
  drug_snapshot JSONB NOT NULL,
  who_input JSONB NOT NULL,
  who_level causality_assessment NOT NULL,
  naranjo_answers JSONB NOT NULL,
  naranjo_score INTEGER NOT NULL CHECK (naranjo_score BETWEEN -4 AND 13),
  naranjo_level causality_assessment NOT NULL,
  alternative_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_source_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_draft_comment TEXT NOT NULL DEFAULT '',
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    review_status IN ('pending', 'accepted', 'edited', 'rejected')
  ),
  final_who_level causality_assessment,
  final_naranjo_level causality_assessment,
  final_comment TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (consultation_id, drug_client_ref)
);

CREATE TABLE IF NOT EXISTS public.ai_consultation_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES public.ai_consultations(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'internal', 'public')),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.ai_consultations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_consultations_report
  ON public.ai_consultations(report_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_user_created
  ON public.ai_consultations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_public_created
  ON public.ai_consultations(public_session_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_drug_assessments_consultation
  ON public.ai_drug_assessments(consultation_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_consultation
  ON public.ai_chat_messages(consultation_id, created_at);

ALTER TABLE public.ai_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_evidence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_drug_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_consultation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- These tables are intentionally service-route only. No anon/authenticated
-- policies are created; the service role performs access checks in the API.

CREATE OR REPLACE FUNCTION public.attach_ai_consultation(
  p_consultation_id UUID,
  p_report_id UUID,
  p_context_hash TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM ai_consultations
    WHERE id = p_consultation_id
      AND context_hash = p_context_hash
      AND status IN ('ready', 'reviewed')
      AND (report_id IS NULL OR report_id = p_report_id)
  ) THEN
    RAISE EXCEPTION 'AI consultation is not attachable';
  END IF;

  UPDATE ai_consultations
  SET report_id = p_report_id,
      expires_at = NULL,
      updated_at = now()
  WHERE id = p_consultation_id;

  UPDATE ai_drug_assessments assessment
  SET suspected_drug_id = drug.id,
      updated_at = now()
  FROM suspected_drugs drug
  WHERE assessment.consultation_id = p_consultation_id
    AND drug.report_id = p_report_id
    AND drug.client_ref = assessment.drug_client_ref;

  IF EXISTS (
    SELECT 1 FROM ai_drug_assessments
    WHERE consultation_id = p_consultation_id
      AND suspected_drug_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unable to map all AI drug assessments';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_ai_consultation(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_ai_consultation(UUID, UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_consultations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_consultations
  WHERE report_id IS NULL
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_ai_consultations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_ai_consultations() TO service_role;
