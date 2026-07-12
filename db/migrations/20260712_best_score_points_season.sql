-- Fair scoring: unlimited practice, but only improvement over the best score
-- in the active season is credited to the leaderboard.

begin;

create table if not exists public.points_seasons (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  is_active boolean not null default true
);

create unique index if not exists points_seasons_one_active_idx
  on public.points_seasons (is_active)
  where is_active;

alter table public.attempts
  add column if not exists idempotency_key uuid null,
  add column if not exists season_id bigint null
    references public.points_seasons(id) on delete restrict,
  add column if not exists points_credited int not null default 0;

create index if not exists attempts_user_test_season_points_idx
  on public.attempts (user_id, test_id, season_id, points_awarded desc);

-- The first application starts a clean rating season while preserving old
-- attempts as history. Reapplying this migration does not reset points again.
do $$
begin
  if not exists (
    select 1 from public.points_seasons where is_active
  ) then
    insert into public.points_seasons (is_active) values (true);

    update public.user_stats
    set total_points = 0,
        tests_completed = 0,
        updated_at = now();
  end if;
end;
$$;

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
  v_season_id bigint;
  v_previous_best int := 0;
  v_is_new_test boolean := false;
  v_points_delta int := 0;
begin
  -- Serialize all submissions from one user to prevent concurrent credits.
  perform 1 from public.users where id = p_user_id for update;

  select id into v_season_id
  from public.points_seasons
  where is_active
  limit 1;

  if v_season_id is null then
    raise exception 'No active points season';
  end if;

  select
    coalesce(max(a.points_awarded), 0),
    count(*) = 0
  into v_previous_best, v_is_new_test
  from public.attempts a
  where a.user_id = p_user_id
    and a.test_id = p_test_id
    and a.season_id = v_season_id;

  -- A retry can only add the difference above the personal best.
  v_points_delta := greatest(0, p_points_awarded - v_previous_best);

  insert into public.attempts (
    user_id,
    test_id,
    score_percent,
    points_awarded,
    points_credited,
    idempotency_key,
    season_id
  )
  values (
    p_user_id,
    p_test_id,
    p_score_percent,
    p_points_awarded,
    v_points_delta,
    p_idempotency_key,
    v_season_id
  );

  insert into public.user_stats (user_id, total_points, tests_completed)
  values (p_user_id, v_points_delta, case when v_is_new_test then 1 else 0 end)
  on conflict on constraint user_stats_pkey do update
    set total_points = public.user_stats.total_points + v_points_delta,
        tests_completed = public.user_stats.tests_completed
          + case when v_is_new_test then 1 else 0 end,
        updated_at = now();

  return query
  select us.user_id, us.total_points, us.tests_completed
  from public.user_stats us
  where us.user_id = p_user_id;
end;
$$;

commit;
