-- Закрытые тесты: видимость каталога + выдача доступа по пользователям
-- Только ADD / CREATE — данные в tests не удаляются

ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tests_visibility_check'
  ) THEN
    ALTER TABLE public.tests
    ADD CONSTRAINT tests_visibility_check
    CHECK (visibility IN ('public', 'restricted'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.test_user_access (
  test_id TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  PRIMARY KEY (test_id, user_id)
);

CREATE INDEX IF NOT EXISTS test_user_access_user_id_idx ON public.test_user_access(user_id);
CREATE INDEX IF NOT EXISTS test_user_access_test_id_idx ON public.test_user_access(test_id);

COMMENT ON COLUMN public.tests.visibility IS 'public — в каталоге для всех; restricted — только пользователям из test_user_access (и админам)';
COMMENT ON TABLE public.test_user_access IS 'Доступ к restricted-тестам по user_id';
