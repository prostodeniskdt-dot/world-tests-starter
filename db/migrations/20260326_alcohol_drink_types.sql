-- Универсальная карточка: тип напитка (отдельно от category_id каталога), подача, переименование сырья

-- Переименовать только если есть старое имя и ещё нет нового (идемпотентно)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'alcohol_products' AND column_name = 'grape_or_raw_material'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'alcohol_products' AND column_name = 'primary_ingredient'
  ) THEN
    ALTER TABLE public.alcohol_products RENAME COLUMN grape_or_raw_material TO primary_ingredient;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'alcohol_submissions' AND column_name = 'grape_or_raw_material'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'alcohol_submissions' AND column_name = 'primary_ingredient'
  ) THEN
    ALTER TABLE public.alcohol_submissions RENAME COLUMN grape_or_raw_material TO primary_ingredient;
  END IF;
END $$;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS drink_type text NOT NULL DEFAULT 'other';

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS additional_ingredients text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS recommended_glassware text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS serve_style text;

ALTER TABLE public.alcohol_submissions
  ADD COLUMN IF NOT EXISTS drink_type text NOT NULL DEFAULT 'other';

ALTER TABLE public.alcohol_submissions
  ADD COLUMN IF NOT EXISTS additional_ingredients text;

ALTER TABLE public.alcohol_submissions
  ADD COLUMN IF NOT EXISTS recommended_glassware text;

ALTER TABLE public.alcohol_submissions
  ADD COLUMN IF NOT EXISTS serve_style text;

CREATE INDEX IF NOT EXISTS idx_alcohol_products_drink_type ON public.alcohol_products(drink_type);

COMMENT ON COLUMN public.alcohol_products.drink_type IS 'Тип напитка (виски, вино…) — управляет сенсорикой и подсказками; не путать с category_id каталога';
COMMENT ON COLUMN public.alcohol_products.category_id IS 'Раздел витрины каталога на сайте';
