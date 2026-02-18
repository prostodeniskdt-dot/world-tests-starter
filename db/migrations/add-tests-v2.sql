-- Миграция: таблица tests с JSONB для хранения тестов
-- Выполните в PostgreSQL после init.sql (Timeweb Cloud, локальный PostgreSQL 18 и т.д.)

DROP TABLE IF EXISTS public.test_options CASCADE;
DROP TABLE IF EXISTS public.test_questions CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;

CREATE TABLE public.tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT '',
  difficulty_level INT NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 3),
  base_points INT NOT NULL DEFAULT 200,
  max_attempts INT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer_key JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tests_is_published_idx ON public.tests(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS tests_category_idx ON public.tests(category);

DROP TRIGGER IF EXISTS tests_set_updated_at ON public.tests;
CREATE TRIGGER tests_set_updated_at
BEFORE UPDATE ON public.tests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
