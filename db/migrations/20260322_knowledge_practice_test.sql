-- Опциональная привязка опубликованного теста к статье (кнопка «закрепить знания»)
ALTER TABLE public.article_submissions
  ADD COLUMN IF NOT EXISTS practice_test_id text REFERENCES public.tests(id) ON DELETE SET NULL;

ALTER TABLE public.knowledge_articles
  ADD COLUMN IF NOT EXISTS practice_test_id text REFERENCES public.tests(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.knowledge_articles.practice_test_id IS 'Публичный тест для кнопки после статьи; NULL — кнопка не показывается';
COMMENT ON COLUMN public.article_submissions.practice_test_id IS 'Тест для закрепления, переносится в knowledge_articles при одобрении';
