-- Разделение: автор рецепта vs кто подготовил карточку для сайта

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS prepared_by text;

ALTER TABLE public.cocktail_submissions
  ADD COLUMN IF NOT EXISTS prepared_by text;

