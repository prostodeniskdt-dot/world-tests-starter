-- Миграция: добавление полей для админ-системы и бана пользователей
-- Выполните в PostgreSQL (psql, Timeweb Cloud, pgAdmin и т.д.)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_until timestamptz;

CREATE INDEX IF NOT EXISTS users_is_admin_idx ON public.users(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS users_is_banned_idx ON public.users(is_banned) WHERE is_banned = true;

UPDATE public.users
SET is_admin = true
WHERE email = 'prostodeniskdt@gmail.com';

COMMENT ON COLUMN public.users.is_admin IS 'Флаг администратора - дает доступ к админ-панели';
COMMENT ON COLUMN public.users.is_banned IS 'Флаг бана - заблокирован ли пользователь';
COMMENT ON COLUMN public.users.banned_until IS 'Дата окончания бана (null = постоянный бан)';
