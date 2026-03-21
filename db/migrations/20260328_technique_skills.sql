-- Техника и навыки: оборудование (расширение), приёмы, связи, аналоги, отзывы, UGC
-- Категория «посуда/бокалы» в оборудовании не сидится — отдельный каталог glassware.

INSERT INTO public.equipment_categories (name, slug, sort_order) VALUES
  ('Блендеры / миксеры', 'blenders_mixers', 10),
  ('Кофемашины / кофемолки', 'coffee_machines_grinders', 20),
  ('Плиты / индукция / горелки', 'stoves_induction_burners', 30),
  ('Льдогенераторы / формы для льда', 'ice_makers_molds', 40),
  ('Барное оборудование', 'bar_equipment', 50),
  ('Холодильное оборудование', 'refrigeration', 60),
  ('Весы / мерный инструмент', 'scales_measuring', 70),
  ('Сифоны / карбонизаторы / инфьюзеры', 'siphons_carbonators', 80),
  ('Ножи / доски / мелкий инвентарь', 'knives_boards_smallware', 90),
  ('Другое', 'equipment_other', 100)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS producer text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]';

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS price_segment text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS price_range text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS purchase_links jsonb NOT NULL DEFAULT '[]';

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS audience text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS experience_pros text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS experience_cons text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS ideal_for text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS not_suitable_for text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS key_specs jsonb NOT NULL DEFAULT '[]';

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS related_knowledge_article_id int REFERENCES public.knowledge_articles(id) ON DELETE SET NULL;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_equipment_tags ON public.equipment USING GIN (tags);

COMMENT ON COLUMN public.equipment.key_specs IS 'Массив объектов {name, value} для параметров модели';
COMMENT ON COLUMN public.equipment.gallery_urls IS 'Массив URL изображений';

CREATE TABLE IF NOT EXISTS public.equipment_substitutes (
  product_id int NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  substitute_id int NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, substitute_id),
  CONSTRAINT equipment_substitutes_order CHECK (product_id < substitute_id),
  CONSTRAINT equipment_substitutes_distinct CHECK (product_id <> substitute_id)
);

CREATE INDEX IF NOT EXISTS idx_equipment_subst_left ON public.equipment_substitutes(product_id);
CREATE INDEX IF NOT EXISTS idx_equipment_subst_right ON public.equipment_substitutes(substitute_id);

-- Приёмы и техники
CREATE TABLE IF NOT EXISTS public.technique_guide_categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.technique_guide_categories (name, slug, sort_order) VALUES
  ('Нарезка / карвинг / гарниш', 'cutting_garnish', 10),
  ('Техники шейкинга / стирринга / билдинга', 'shake_stir_build', 20),
  ('Работа со льдом', 'ice_work', 30),
  ('Работа с огнём / подкопчение / фламбе', 'fire_smoke_flambe', 40),
  ('Инфьюзии / мацерации / выдержка', 'infusion_maceration', 50),
  ('Латте-арт / пенные техники', 'latte_art_foam', 60),
  ('Подача / презентация', 'presentation', 70),
  ('Организация рабочего места / спид-бар', 'bar_organization', 80),
  ('Работа с кофе / чаем', 'coffee_tea_work', 90),
  ('Другое', 'guide_other', 100)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.technique_guides (
  id serial PRIMARY KEY,
  category_id int NOT NULL REFERENCES public.technique_guide_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  difficulty text,
  short_description text,
  instruction_text text,
  video_url text,
  gallery_urls jsonb NOT NULL DEFAULT '[]',
  typical_mistakes text,
  tips text,
  cocktail_slugs jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  related_knowledge_article_id int REFERENCES public.knowledge_articles(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technique_guides_category ON public.technique_guides(category_id);
CREATE INDEX IF NOT EXISTS idx_technique_guides_slug ON public.technique_guides(slug);
CREATE INDEX IF NOT EXISTS idx_technique_guides_published ON public.technique_guides(is_published) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_technique_guides_tags ON public.technique_guides USING GIN (tags);

DROP TRIGGER IF EXISTS technique_guides_set_updated_at ON public.technique_guides;
CREATE TRIGGER technique_guides_set_updated_at
  BEFORE UPDATE ON public.technique_guides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.equipment_technique_links (
  equipment_id int NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  guide_id int NOT NULL REFERENCES public.technique_guides(id) ON DELETE CASCADE,
  PRIMARY KEY (equipment_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_eq_tech_links_guide ON public.equipment_technique_links(guide_id);

CREATE TABLE IF NOT EXISTS public.technique_guide_na_links (
  guide_id int NOT NULL REFERENCES public.technique_guides(id) ON DELETE CASCADE,
  na_product_slug text NOT NULL,
  PRIMARY KEY (guide_id, na_product_slug)
);

CREATE INDEX IF NOT EXISTS idx_tg_na_slug ON public.technique_guide_na_links(na_product_slug);

CREATE TABLE IF NOT EXISTS public.technique_guide_alcohol_links (
  guide_id int NOT NULL REFERENCES public.technique_guides(id) ON DELETE CASCADE,
  alcohol_product_slug text NOT NULL,
  PRIMARY KEY (guide_id, alcohol_product_slug)
);

CREATE INDEX IF NOT EXISTS idx_tg_alc_slug ON public.technique_guide_alcohol_links(alcohol_product_slug);

-- Отзывы на оборудование (модерация)
CREATE TABLE IF NOT EXISTS public.equipment_reviews (
  id serial PRIMARY KEY,
  equipment_id int NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  usage_duration text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_reviews_equipment ON public.equipment_reviews(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_reviews_status ON public.equipment_reviews(status) WHERE status = 'pending';

-- UGC заявки: оборудование
CREATE TABLE IF NOT EXISTS public.equipment_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category_id int REFERENCES public.equipment_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  image_url text,
  gallery_urls jsonb NOT NULL DEFAULT '[]',
  description text,
  producer text,
  price_segment text,
  price_range text,
  purchase_links jsonb NOT NULL DEFAULT '[]',
  audience text,
  experience_pros text,
  experience_cons text,
  ideal_for text,
  not_suitable_for text,
  key_specs jsonb NOT NULL DEFAULT '[]',
  recommendations text,
  tags text[] NOT NULL DEFAULT '{}',
  related_knowledge_article_id int,
  photo_rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_submissions_pending ON public.equipment_submissions(status) WHERE status = 'pending';

DROP TRIGGER IF EXISTS equipment_submissions_set_updated_at ON public.equipment_submissions;
CREATE TRIGGER equipment_submissions_set_updated_at
  BEFORE UPDATE ON public.equipment_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- UGC заявки: приёмы
CREATE TABLE IF NOT EXISTS public.technique_guide_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category_id int NOT NULL REFERENCES public.technique_guide_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  difficulty text,
  short_description text,
  instruction_text text,
  video_url text,
  gallery_urls jsonb NOT NULL DEFAULT '[]',
  typical_mistakes text,
  tips text,
  cocktail_slugs jsonb NOT NULL DEFAULT '[]',
  na_slugs jsonb NOT NULL DEFAULT '[]',
  alcohol_slugs jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  related_knowledge_article_id int,
  photo_rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_submissions_pending ON public.technique_guide_submissions(status) WHERE status = 'pending';

DROP TRIGGER IF EXISTS technique_guide_submissions_set_updated_at ON public.technique_guide_submissions;
CREATE TRIGGER technique_guide_submissions_set_updated_at
  BEFORE UPDATE ON public.technique_guide_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
