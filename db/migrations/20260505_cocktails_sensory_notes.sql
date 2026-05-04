-- Текстовые блоки: вкус, аромат, пейринг (карточка коктейля)

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS taste_notes text,
  ADD COLUMN IF NOT EXISTS aroma_notes text,
  ADD COLUMN IF NOT EXISTS pairing_notes text;

ALTER TABLE public.cocktail_submissions
  ADD COLUMN IF NOT EXISTS taste_notes text,
  ADD COLUMN IF NOT EXISTS aroma_notes text,
  ADD COLUMN IF NOT EXISTS pairing_notes text;
