-- Текст «о себе» и достижения для публичного просмотра профиля (в т.ч. с карточки автора статьи)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_about text,
  ADD COLUMN IF NOT EXISTS profile_achievements text;

COMMENT ON COLUMN public.users.profile_about IS 'О себе; виден другим при открытии профиля по ссылке';
COMMENT ON COLUMN public.users.profile_achievements IS 'Достижения; виден другим при открытии профиля по ссылке';
