-- Аватар и фон личного кабинета (URL в S3 или иное публичное хранилище)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS profile_cover_url text;

COMMENT ON COLUMN public.users.avatar_url IS 'Публичный URL аватара (профиль, меню)';
COMMENT ON COLUMN public.users.profile_cover_url IS 'Публичный URL фона шапки личного кабинета';
