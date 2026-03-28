-- Комплексная переработка модели авторства коктейлей (Вариант C):
-- submitted_by_user_id хранит связь с аккаунтом, подавшим заявку

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
