-- Reports are valid immediately after submission; admin approval is no longer required.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type type
    JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
    WHERE type.typname = 'approval_status' AND namespace.nspname = 'public'
  ) THEN
    CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

ALTER TABLE public.adr_reports
  ADD COLUMN IF NOT EXISTS approval_status public.approval_status DEFAULT 'approved' NOT NULL,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approval_note TEXT;

ALTER TABLE public.adr_reports
  ALTER COLUMN approval_status SET DEFAULT 'approved'::public.approval_status;

UPDATE public.adr_reports
SET
  approval_status = 'approved'::public.approval_status,
  approved_by = NULL,
  approved_at = now(),
  approval_note = NULL
WHERE approval_status IS DISTINCT FROM 'approved'::public.approval_status;

COMMENT ON COLUMN public.adr_reports.approval_status IS
  'Legacy compatibility field. Reports are valid immediately and default to approved.';
COMMENT ON COLUMN public.adr_reports.approved_by IS
  'Legacy compatibility field; no admin approval is required.';
COMMENT ON COLUMN public.adr_reports.approved_at IS
  'Legacy compatibility field; migrated reports record the policy transition time.';
COMMENT ON COLUMN public.adr_reports.approval_note IS
  'Legacy compatibility field; no approval or rejection note is collected.';
