-- О том О сем: каталоги (алкоголь, б/а, техника, коктейли, посуда), база знаний, UGC

-- 1. Алкоголь
CREATE TABLE IF NOT EXISTS public.alcohol_categories (
  id serial PRIMARY KEY,
  parent_id int REFERENCES public.alcohol_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alcohol_products (
  id serial PRIMARY KEY,
  category_id int REFERENCES public.alcohol_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  description text,
  history text,
  country text,
  producer text,
  abv numeric(4,1),
  flavor_profile jsonb DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alcohol_products_category ON public.alcohol_products(category_id);
CREATE INDEX IF NOT EXISTS idx_alcohol_products_slug ON public.alcohol_products(slug);
CREATE INDEX IF NOT EXISTS idx_alcohol_products_published ON public.alcohol_products(is_published) WHERE is_published;

-- 2. Безалкогольное
CREATE TABLE IF NOT EXISTS public.na_categories (
  id serial PRIMARY KEY,
  parent_id int REFERENCES public.na_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.na_products (
  id serial PRIMARY KEY,
  category_id int REFERENCES public.na_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  description text,
  composition text,
  calories text,
  producer text,
  flavor_profile jsonb DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_na_products_category ON public.na_products(category_id);
CREATE INDEX IF NOT EXISTS idx_na_products_slug ON public.na_products(slug);
CREATE INDEX IF NOT EXISTS idx_na_products_published ON public.na_products(is_published) WHERE is_published;

-- 3. Техника
CREATE TABLE IF NOT EXISTS public.equipment_categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment (
  id serial PRIMARY KEY,
  category_id int REFERENCES public.equipment_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  description text,
  specs jsonb DEFAULT '{}',
  recommendations text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_slug ON public.equipment(slug);
CREATE INDEX IF NOT EXISTS idx_equipment_published ON public.equipment(is_published) WHERE is_published;

-- 4. Коктейли
CREATE TABLE IF NOT EXISTS public.cocktail_categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cocktails (
  id serial PRIMARY KEY,
  category_id int REFERENCES public.cocktail_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  description text,
  method text,
  glass text,
  garnish text,
  ice text,
  ingredients jsonb DEFAULT '[]',
  instructions text,
  cordials_recipe text,
  bar_name text,
  bar_city text,
  bar_description text,
  author text,
  social_links jsonb DEFAULT '{}',
  flavor_profile jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_classic boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cocktails_category ON public.cocktails(category_id);
CREATE INDEX IF NOT EXISTS idx_cocktails_slug ON public.cocktails(slug);
CREATE INDEX IF NOT EXISTS idx_cocktails_published ON public.cocktails(is_published) WHERE is_published;

-- 5. Посуда
CREATE TABLE IF NOT EXISTS public.glassware_categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.glassware (
  id serial PRIMARY KEY,
  category_id int REFERENCES public.glassware_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  description text,
  volume text,
  dimensions text,
  usage text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glassware_category ON public.glassware(category_id);
CREATE INDEX IF NOT EXISTS idx_glassware_slug ON public.glassware(slug);
CREATE INDEX IF NOT EXISTS idx_glassware_published ON public.glassware(is_published) WHERE is_published;

-- 6. База знаний
CREATE TABLE IF NOT EXISTS public.knowledge_categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id serial PRIMARY KEY,
  category_id int REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  author_name text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON public.knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_slug ON public.knowledge_articles(slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_published ON public.knowledge_articles(is_published) WHERE is_published;

-- 7. UGC — заявки на публикацию статей (модерация)
CREATE TABLE IF NOT EXISTS public.article_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_submissions_user ON public.article_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_submissions_status ON public.article_submissions(status) WHERE status = 'pending';

COMMENT ON TABLE public.article_submissions IS 'UGC: заявки пользователей на публикацию статей в Базу знаний, требуют модерации';

-- Триггеры updated_at (функция set_updated_at уже есть в init.sql)
DROP TRIGGER IF EXISTS alcohol_products_set_updated_at ON public.alcohol_products;
CREATE TRIGGER alcohol_products_set_updated_at
  BEFORE UPDATE ON public.alcohol_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS na_products_set_updated_at ON public.na_products;
CREATE TRIGGER na_products_set_updated_at
  BEFORE UPDATE ON public.na_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS equipment_set_updated_at ON public.equipment;
CREATE TRIGGER equipment_set_updated_at
  BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS cocktails_set_updated_at ON public.cocktails;
CREATE TRIGGER cocktails_set_updated_at
  BEFORE UPDATE ON public.cocktails FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS glassware_set_updated_at ON public.glassware;
CREATE TRIGGER glassware_set_updated_at
  BEFORE UPDATE ON public.glassware FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS knowledge_articles_set_updated_at ON public.knowledge_articles;
CREATE TRIGGER knowledge_articles_set_updated_at
  BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS article_submissions_set_updated_at ON public.article_submissions;
CREATE TRIGGER article_submissions_set_updated_at
  BEFORE UPDATE ON public.article_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
