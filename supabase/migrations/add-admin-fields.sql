-- Миграция: добавление полей для админ-системы и бана пользователей
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Добавляем поля is_admin и is_banned в таблицу users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_until timestamptz;

-- 2. Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON public.users(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS users_is_banned_idx ON public.users(is_banned) WHERE is_banned = true;

-- 3. Устанавливаем админские права для prostodeniskdt@gmail.com
UPDATE public.users
SET is_admin = true
WHERE email = 'prostodeniskdt@gmail.com';

-- 4. Комментарии к полям
COMMENT ON COLUMN public.users.is_admin IS 'Флаг администратора - дает доступ к админ-панели';
COMMENT ON COLUMN public.users.is_banned IS 'Флаг бана - заблокирован ли пользователь';
COMMENT ON COLUMN public.users.banned_until IS 'Дата окончания бана (null = постоянный бан)';
