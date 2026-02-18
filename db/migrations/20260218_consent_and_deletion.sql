-- Consent, public rating display, account deletion (14 working days)
-- Run after init.sql or on existing DB (PostgreSQL, в т.ч. Timeweb Cloud / PostgreSQL 18).

-- 1) Users: consent for public rating + deletion request timestamp
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS consent_public_rating boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delete_requested_at timestamptz;

COMMENT ON COLUMN public.users.consent_public_rating IS 'Согласие на показ в публичном рейтинге (ник или Имя + буква фамилии)';
COMMENT ON COLUMN public.users.delete_requested_at IS 'Дата запроса удаления аккаунта; данные удаляются через 14 рабочих дней';

-- 2) Consent logs (date/time, IP, document version)
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('pdp', 'public_rating', 'cookies')),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text,
  document_version text NOT NULL
);

CREATE INDEX IF NOT EXISTS consent_logs_user_id_idx ON public.consent_logs(user_id);
CREATE INDEX IF NOT EXISTS consent_logs_consent_type_idx ON public.consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS consent_logs_accepted_at_idx ON public.consent_logs(accepted_at DESC);

-- 3) Leaderboard view: only users with consent, no email, display_name = nick or "Name L."
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard AS
SELECT
  us.user_id,
  u.first_name,
  u.last_name,
  u.telegram_username,
  us.total_points,
  us.tests_completed,
  CASE
    WHEN u.telegram_username IS NOT NULL AND trim(u.telegram_username) <> ''
    THEN u.telegram_username
    ELSE trim(u.first_name || ' ' || left(u.last_name, 1) || '.')
  END AS display_name,
  rank() OVER (
    ORDER BY us.total_points DESC, us.updated_at ASC, us.user_id ASC
  ) AS rank
FROM public.user_stats us
JOIN public.users u ON u.id = us.user_id
WHERE u.consent_public_rating = true
  AND u.delete_requested_at IS NULL;
