-- Миграция: таблица для хранения ответов по каждой попытке
-- Только добавление, без изменения таблицы tests

CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  user_answer jsonb NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attempt_answers_attempt_id_idx ON public.attempt_answers(attempt_id);

COMMENT ON TABLE public.attempt_answers IS 'Ответы пользователя по каждому вопросу попытки для отображения деталей';
