-- Добавляем колонку author в таблицу tests (для подписи под названием теста)
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS author text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.tests.author IS 'Имя автора теста (например: Денис Колодешников). Пустая строка = показывать значение по умолчанию на сайте.';
