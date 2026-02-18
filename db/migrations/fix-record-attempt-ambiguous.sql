-- Исправление: "column reference user_id is ambiguous" в record_attempt
-- Причина: в ON CONFLICT DO UPDATE нужно явно указывать имя таблицы для колонок

create or replace function public.record_attempt(
  p_user_id uuid,
  p_test_id text,
  p_score_percent int,
  p_points_awarded int
)
returns table (
  user_id uuid,
  total_points bigint,
  tests_completed int
)
language plpgsql
set search_path = public
as $$
declare
  v_previous_points int := 0;
  v_is_new_test boolean := false;
  v_points_delta int;
begin
  select points_awarded into v_previous_points
  from public.attempts
  where attempts.user_id = p_user_id
    and attempts.test_id = p_test_id
  order by attempts.created_at desc
  limit 1;

  if v_previous_points is null then
    v_is_new_test := true;
    v_previous_points := 0;
  end if;

  v_points_delta := p_points_awarded - v_previous_points;

  insert into public.attempts (user_id, test_id, score_percent, points_awarded)
  values (p_user_id, p_test_id, p_score_percent, p_points_awarded);

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

-- Выдать права админа для prostodeniskdt@gmail.com
UPDATE public.users
SET is_admin = true
WHERE email = 'prostodeniskdt@gmail.com';
