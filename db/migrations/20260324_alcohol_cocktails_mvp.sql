-- MVP: блюда в карточке алкоголя, расширенные коктейли, UGC заявки на коктейли

ALTER TABLE public.alcohol_products
  ADD COLUMN IF NOT EXISTS food_usage text;

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS history text;

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS allergens text;

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS strength_scale smallint;

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS taste_sweet_dry_scale smallint;

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]';

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS nutrition_note text;

ALTER TABLE public.cocktails
  ADD COLUMN IF NOT EXISTS alcohol_content_note text;

CREATE TABLE IF NOT EXISTS public.cocktail_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  method text,
  glass text,
  garnish text,
  ice text,
  ingredients jsonb NOT NULL DEFAULT '[]',
  instructions text,
  cordials_recipe text,
  bar_name text,
  bar_city text,
  bar_description text,
  author text,
  social_links jsonb NOT NULL DEFAULT '{}',
  flavor_profile jsonb NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  image_url text,
  gallery_urls jsonb NOT NULL DEFAULT '[]',
  history text,
  allergens text,
  strength_scale smallint,
  taste_sweet_dry_scale smallint,
  nutrition_note text,
  alcohol_content_note text,
  photo_rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cocktail_submissions_user ON public.cocktail_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_cocktail_submissions_status ON public.cocktail_submissions(status) WHERE status = 'pending';

DROP TRIGGER IF EXISTS cocktail_submissions_set_updated_at ON public.cocktail_submissions;
CREATE TRIGGER cocktail_submissions_set_updated_at
  BEFORE UPDATE ON public.cocktail_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.cocktail_submissions IS 'UGC: заявки на публикацию коктейлей; is_classic задаёт админ при одобрении';
