-- Б/А ингредиенты: категории (сид), расширение na_products, UGC, аналоги

-- Категории (ON CONFLICT — безопасный повторный прогон)
INSERT INTO public.na_categories (name, slug, sort_order) VALUES
  ('Сиропы', 'syrups', 10),
  ('Пюре / джемы / конфитюры', 'purees_jams', 20),
  ('Тоники / газировки / лимонады', 'tonics_sodas', 30),
  ('Соки / фреши / нектар', 'juices', 40),
  ('Биттеры (безалкогольные)', 'bitters_na', 50),
  ('Молочные / растительное молоко / сливки', 'milk_plant_milk_cream', 60),
  ('Специи / травы / пряности', 'spices_herbs', 70),
  ('Топинги / гарниши / декор', 'toppings_garnish', 80),
  ('Соусы / шринки / кордиалы', 'sauces_shrubs_cordials', 90),
  ('Чай / кофе / какао', 'tea_coffee_cocoa', 100),
  ('Лёд (формы, типы)', 'ice', 110),
  ('Другое', 'other', 120)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS subcategory_text text;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS amount_numeric numeric(14, 4);

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS amount_unit text;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS taste_description text;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS usage_in_drinks text;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS usage_in_food text;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS about_brand text;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS interesting_facts text;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS related_knowledge_article_id int REFERENCES public.knowledge_articles(id) ON DELETE SET NULL;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS practice_test_id text REFERENCES public.tests(id) ON DELETE SET NULL;

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS category_specific jsonb NOT NULL DEFAULT '{}';

ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS category_extra jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_na_products_tags ON public.na_products USING GIN (tags);

COMMENT ON COLUMN public.na_products.category_specific IS 'Условные поля по типу категории (сиропы, соки и т.д.)';
COMMENT ON COLUMN public.na_products.category_extra IS 'Свободные характеристики для категорий без жёсткой формы';

CREATE TABLE IF NOT EXISTS public.na_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category_id int NOT NULL REFERENCES public.na_categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  image_url text,
  description text,
  subcategory_text text,
  tags text[] NOT NULL DEFAULT '{}',
  producer text,
  country text,
  amount_numeric numeric(14, 4),
  amount_unit text,
  taste_description text,
  flavor_profile jsonb NOT NULL DEFAULT '{}',
  usage_in_drinks text,
  usage_in_food text,
  about_brand text,
  interesting_facts text,
  category_specific jsonb NOT NULL DEFAULT '{}',
  category_extra jsonb NOT NULL DEFAULT '{}',
  practice_test_id text,
  related_knowledge_article_id int,
  photo_rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_na_submissions_user ON public.na_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_na_submissions_status ON public.na_submissions(status) WHERE status = 'pending';

DROP TRIGGER IF EXISTS na_submissions_set_updated_at ON public.na_submissions;
CREATE TRIGGER na_submissions_set_updated_at
  BEFORE UPDATE ON public.na_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.na_submissions IS 'UGC: заявки на карточки Б/А ингредиентов';

-- Аналоги: каноническая пара (меньший id, больший id)
CREATE TABLE IF NOT EXISTS public.na_product_substitutes (
  product_id int NOT NULL REFERENCES public.na_products(id) ON DELETE CASCADE,
  substitute_id int NOT NULL REFERENCES public.na_products(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, substitute_id),
  CONSTRAINT na_substitutes_order CHECK (product_id < substitute_id),
  CONSTRAINT na_substitutes_distinct CHECK (product_id <> substitute_id)
);

CREATE INDEX IF NOT EXISTS idx_na_substitutes_by_left ON public.na_product_substitutes(product_id);
CREATE INDEX IF NOT EXISTS idx_na_substitutes_by_right ON public.na_product_substitutes(substitute_id);

COMMENT ON TABLE public.na_product_substitutes IS 'Прямые пары аналогов (только соседи; хранить с product_id < substitute_id)';
