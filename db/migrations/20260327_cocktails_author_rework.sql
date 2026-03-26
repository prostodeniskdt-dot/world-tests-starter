-- Разделение авторства для классических рецептов и источник загрузки

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS classic_original_author text;

ALTER TABLE public.cocktail_submissions
  ADD COLUMN IF NOT EXISTS classic_original_author text;

ALTER TABLE public.cocktail_submissions
  ADD COLUMN IF NOT EXISTS is_classic boolean NOT NULL DEFAULT false;
