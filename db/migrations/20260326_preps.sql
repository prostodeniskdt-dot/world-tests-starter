-- Заготовки: категории, каталог, UGC заявки + поиск

-- Для ILIKE/поиска по ключевым словам (опционально, но ускоряет)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1) Категории заготовок
CREATE TABLE IF NOT EXISTS public.prep_categories (
  id serial PRIMARY KEY,
  parent_id int REFERENCES public.prep_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Каталог заготовок
CREATE TABLE IF NOT EXISTS public.preps (
  id serial PRIMARY KEY,
  category_id int REFERENCES public.prep_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  composition text,
  ingredients jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  image_url text,
  author text,
  bar_name text,
  bar_city text,
  bar_description text,
  social_links jsonb NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preps_category ON public.preps(category_id);
CREATE INDEX IF NOT EXISTS idx_preps_slug ON public.preps(slug);
CREATE INDEX IF NOT EXISTS idx_preps_published ON public.preps(is_published) WHERE is_published;

-- Поиск по ключевым словам: название/состав/ингредиенты (быстрый старт через ILIKE + trgm)
CREATE INDEX IF NOT EXISTS idx_preps_name_trgm ON public.preps USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_preps_composition_trgm ON public.preps USING gin (composition gin_trgm_ops);

-- 3) UGC заявки (модерация)
CREATE TABLE IF NOT EXISTS public.prep_submissions (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category_id int REFERENCES public.prep_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  composition text,
  ingredients jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  image_url text,
  author text,
  bar_name text,
  bar_city text,
  bar_description text,
  social_links jsonb NOT NULL DEFAULT '{}',
  photo_rights_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prep_submissions_user ON public.prep_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_prep_submissions_status ON public.prep_submissions(status) WHERE status = 'pending';

-- Поиск по заявкам в админке
CREATE INDEX IF NOT EXISTS idx_prep_submissions_name_trgm ON public.prep_submissions USING gin (name gin_trgm_ops);

-- Триггеры updated_at (функция set_updated_at уже есть в init.sql)
DROP TRIGGER IF EXISTS preps_set_updated_at ON public.preps;
CREATE TRIGGER preps_set_updated_at
  BEFORE UPDATE ON public.preps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS prep_submissions_set_updated_at ON public.prep_submissions;
CREATE TRIGGER prep_submissions_set_updated_at
  BEFORE UPDATE ON public.prep_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.preps IS 'Каталог заготовок (сиропы, кордиалы, гарниши и т.д.)';
COMMENT ON TABLE public.prep_submissions IS 'UGC: заявки на публикацию заготовок; требуют модерации';
