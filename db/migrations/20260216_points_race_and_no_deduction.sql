-- PostgreSQL (в т.ч. 18). Миграции системы очков.
-- Улучшение системы очков: устранение гонки и запрет вычитания при худшем результате
-- 1) Блокировка по user_id устраняет двойное начисление при одновременных сабмитах
-- 2) Дельта не может быть отрицательной: при пересдаче с худшим результатом очки не вычитаются
-- 3) Колонка idempotency_key для аудита связи попытки с ключом идемпотентности

alter table public.attempts
  add column if not exists idempotency_key uuid null;

create or replace function public.record_attempt(
  p_user_id uuid,
  p_test_id text,
  p_score_percent int,
  p_points_awarded int,
  p_idempotency_key uuid default null
)
returns table (
  user_id uuid,
  total_points bigint,
  tests_completed int
)
language plpgsql
set search_path = public
security definer
as $$
declare
  v_previous_points int := 0;
  v_is_new_test boolean := false;
  v_points_delta int;
begin
  -- Блокируем строку пользователя, чтобы сериализовать одновременные сабмиты одного пользователя
  perform 1 from public.users where id = p_user_id for update;

  -- Находим предыдущую попытку по этому тесту для этого пользователя
  select attempts.points_awarded into v_previous_points
  from public.attempts
  where attempts.user_id = p_user_id
    and attempts.test_id = p_test_id
  order by attempts.created_at desc
  limit 1;

  if v_previous_points is null then
    v_is_new_test := true;
    v_previous_points := 0;
  end if;

  -- Разница очков: не вычитаем при худшем результате (только прирост или 0)
  v_points_delta := greatest(0, p_points_awarded - v_previous_points);

  -- Записываем новую попытку (история сохраняется)
  insert into public.attempts (user_id, test_id, score_percent, points_awarded, idempotency_key)
  values (p_user_id, p_test_id, p_score_percent, p_points_awarded, p_idempotency_key);

  -- Обновляем статистику пользователя
  insert into public.user_stats (user_id, total_points, tests_completed)
  values (p_user_id, v_points_delta, case when v_is_new_test then 1 else 0 end)
  on conflict on constraint user_stats_pkey do update
    set total_points = user_stats.total_points + v_points_delta,
        tests_completed = user_stats.tests_completed + case when v_is_new_test then 1 else 0 end,
        updated_at = now();

  return query
  select us.user_id, us.total_points, us.tests_completed
  from public.user_stats us
  where us.user_id = p_user_id;
end;
$$;
