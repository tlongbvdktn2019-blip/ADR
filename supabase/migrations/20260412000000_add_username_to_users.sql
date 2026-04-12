ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

WITH normalized AS (
  SELECT
    id,
    created_at,
    CASE
      WHEN length(cleaned_username) = 0 THEN 'user'
      WHEN length(cleaned_username) < 3 THEN rpad(cleaned_username, 3, '0')
      ELSE cleaned_username
    END AS base_username
  FROM (
    SELECT
      id,
      created_at,
      left(
        regexp_replace(
          regexp_replace(
            lower(split_part(email, '@', 1)),
            '[^a-z0-9._-]+',
            '-',
            'g'
          ),
          '(^[._-]+|[._-]+$)',
          '',
          'g'
        ),
        50
      ) AS cleaned_username
    FROM public.users
  ) src
),
ranked AS (
  SELECT
    id,
    base_username,
    row_number() OVER (PARTITION BY base_username ORDER BY created_at NULLS LAST, id) AS base_rank
  FROM normalized
)
UPDATE public.users AS u
SET username = CASE
  WHEN r.base_rank = 1 THEN r.base_username
  ELSE left(r.base_username, 50 - length((r.base_rank - 1)::text) - 1) || '-' || (r.base_rank - 1)::text
END
FROM ranked r
WHERE u.id = r.id
  AND (u.username IS NULL OR btrim(u.username) = '');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_username_format_check'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_username_format_check
    CHECK (username ~ '^[a-z0-9._-]{3,50}$');
  END IF;
END $$;

ALTER TABLE public.users
ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key
ON public.users (username);
