-- Посуда: категории, расширение glassware, UGC заявки, фото с напитком, аналоги, связи с приёмами

INSERT INTO public.glassware_categories (name, slug, sort_order) VALUES
  ('Бокалы для коктейлей', 'cocktail_glasses', 10),
  ('Бокалы для вина', 'wine_glasses', 20),
  ('Бокалы для пива', 'beer_glasses', 30),
  ('Стопки / шоты', 'shots', 40),
  ('Кружки / чашки', 'mugs_cups', 50),
  ('Питчеры / кувшины', 'pitchers_jugs', 60),
  ('Барный инвентарь', 'bar_tools', 70),
  ('Сервировка', 'serving', 80),
  ('Кухонная посуда', 'kitchenware', 90),
  ('Другое', 'other', 100)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Расширение glassware
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS subcategory_text text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS producer text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS volume_ml int;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS price_segment text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS price_range text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS purchase_links jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS audience text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS ideal_for_drinks text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS not_suitable_for text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS experience_pros text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS experience_cons text;
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS practicality_score int CHECK (practicality_score IS NULL OR (practicality_score >= 1 AND practicality_score <= 5));
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS aesthetics_score int CHECK (aesthetics_score IS NULL OR (aesthetics_score >= 1 AND aesthetics_score <= 5));
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS durability_score int CHECK (durability_score IS NULL OR (durability_score >= 1 AND durability_score <= 5));
ALTER TABLE public.glassware ADD COLUMN IF NOT EXISTS related_knowledge_article_id int REFERENCES public.knowledge_articles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_glassware_tags ON public.glassware USING GIN (tags);

-- Галерея «Фото с напитком» (UGC, модерация)
CREATE TABLE IF NOT EXISTS public.glassware_drink_photos (
  id serial PRIMARY KEY,
  glassware_id int NOT NULL REFERENCES public.glassware(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glassware_drink_photos_glassware ON public.glassware_drink_photos(glassware_id);
CREATE INDEX IF NOT EXISTS idx_glassware_drink_photos_pending ON public.glassware_drink_photos(status) WHERE status = 'pending';

-- Аналоги посуды
CREATE TABLE IF NOT EXISTS public.glassware_substitutes (
  product_id int NOT NULL REFERENCES public.glassware(id) ON DELETE CASCADE,
  substitute_id int NOT NULL REFERENCES public.glassware(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, substitute_id),
  CONSTRAINT glassware_substitutes_order CHECK (product_id < substitute_id),
  CONSTRAINT glassware_substitutes_distinct CHECK (product_id <> substitute_id)
);

CREATE INDEX IF NOT EXISTS idx_glassware_subst_left ON public.glassware_substitutes(product_id);
CREATE INDEX IF NOT EXISTS idx_glassware_subst_right ON public.glassware_substitutes(substitute_id);

-- Связь с приёмами (technique_guides)
CREATE TABLE IF NOT EXISTS public.glassware_technique_links (
  glassware_id int NOT NULL REFERENCES public.glassware(id) ON DELETE CASCADE,
  guide_id int NOT NULL REFERENCES public.technique_guides(id) ON DELETE CASCADE,
  PRIMARY KEY (glassware_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_glassware_tech_links_guide ON public.glassware_technique_links(guide_id);

-- UGC заявки на карточки посуды
CREATE TABLE IF NOT EXISTS public.glassware_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category_id int REFERENCES public.glassware_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  image_url text,
  gallery_urls jsonb NOT NULL DEFAULT '[]',
  description text,
  subcategory_text text,
  producer text,
  material text,
  volume_ml int,
  dimensions text,
  price_segment text,
  price_range text,
  purchase_links jsonb NOT NULL DEFAULT '[]',
  audience text,
  tags text[] NOT NULL DEFAULT '{}',
  ideal_for_drinks text,
  not_suitable_for text,
  experience_pros text,
  experience_cons text,
  practicality_score int CHECK (practicality_score IS NULL OR (practicality_score >= 1 AND practicality_score <= 5)),
  aesthetics_score int CHECK (aesthetics_score IS NULL OR (aesthetics_score >= 1 AND aesthetics_score <= 5)),
  durability_score int CHECK (durability_score IS NULL OR (durability_score >= 1 AND durability_score <= 5)),
  related_knowledge_article_id int,
  photo_rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glassware_submissions_pending ON public.glassware_submissions(status) WHERE status = 'pending';

DROP TRIGGER IF EXISTS glassware_submissions_set_updated_at ON public.glassware_submissions;
CREATE TRIGGER glassware_submissions_set_updated_at
  BEFORE UPDATE ON public.glassware_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
