-- UGC алкоголь: расширенная карточка, заявки, статья и тест, сенсорная матрица

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS grape_or_raw_material text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS volume text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS serving_temperature text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS aging_method text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS production_method text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS interesting_facts text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS about_brand text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS gastronomy text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS wine_or_spirit_style text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS tasting_notes text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS vineyards_or_origin_detail text;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS sensory_matrix jsonb NOT NULL DEFAULT '{}';

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS practice_test_id text REFERENCES public.tests(id) ON DELETE SET NULL;

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS related_knowledge_article_id int REFERENCES public.knowledge_articles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.alcohol_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category_id int REFERENCES public.alcohol_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  image_url text,
  description text,
  history text,
  country text,
  region text,
  producer text,
  abv numeric(4,1),
  flavor_profile jsonb NOT NULL DEFAULT '{}',
  sensory_matrix jsonb NOT NULL DEFAULT '{}',
  grape_or_raw_material text,
  volume text,
  serving_temperature text,
  aging_method text,
  production_method text,
  interesting_facts text,
  about_brand text,
  gastronomy text,
  wine_or_spirit_style text,
  tasting_notes text,
  vineyards_or_origin_detail text,
  food_usage text,
  practice_test_id text,
  related_knowledge_article_id int,
  photo_rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alcohol_submissions_user ON public.alcohol_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_alcohol_submissions_status ON public.alcohol_submissions(status) WHERE status = 'pending';

DROP TRIGGER IF EXISTS alcohol_submissions_set_updated_at ON public.alcohol_submissions;
CREATE TRIGGER alcohol_submissions_set_updated_at
  BEFORE UPDATE ON public.alcohol_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.alcohol_submissions IS 'UGC: заявки на карточки алкоголя; модерация перед публикацией';
