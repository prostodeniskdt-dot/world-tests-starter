-- King of the Bar starter schema
-- Run in Supabase SQL Editor.

-- 1) Extensions
create extension if not exists "pgcrypto";

-- 2) Tables

create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  first_name text not null check (char_length(first_name) between 1 and 50),
  last_name text not null check (char_length(last_name) between 1 and 50),
  telegram_username text check (char_length(telegram_username) between 1 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_stats (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_points bigint not null default 0,
  tests_completed int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  test_id text not null,
  score_percent int not null check (score_percent between 0 and 100),
  points_awarded int not null check (points_awarded >= 0),
  created_at timestamptz not null default now()
);

-- 3) Indices
create index if not exists attempts_user_id_created_at_idx
  on public.attempts (user_id, created_at desc);

create index if not exists user_stats_total_points_idx
  on public.user_stats (total_points desc);

-- 4) updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists user_stats_set_updated_at on public.user_stats;
create trigger user_stats_set_updated_at
before update on public.user_stats
for each row
execute function public.set_updated_at();

-- 5) RLS (опционально, но рекомендовано)
-- Для стартера мы включаем RLS и НЕ создаём публичные политики.
-- Сайт работает через service_role key на сервере.
alter table public.users enable row level security;
alter table public.user_stats enable row level security;
alter table public.attempts enable row level security;

-- 6) RPC: атомарная запись попытки и обновление статистики
-- (Удобно, чтобы не было гонок при одновременных сабмитах)
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
security definer
set search_path = public
as $$
begin
  -- Пользователь должен уже существовать, просто записываем попытку
  insert into public.attempts (user_id, test_id, score_percent, points_awarded)
  values (p_user_id, p_test_id, p_score_percent, p_points_awarded);

  insert into public.user_stats as us (user_id, total_points, tests_completed)
  values (p_user_id, p_points_awarded, 1)
  on conflict (user_id) do update
    set total_points = us.total_points + excluded.total_points,
        tests_completed = us.tests_completed + 1,
        updated_at = now();

  return query
  select us.user_id, us.total_points, us.tests_completed
  from public.user_stats us
  where us.user_id = p_user_id;
end;
$$;

-- 8) Функция для регистрации нового пользователя по email
create or replace function public.register_user(
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_telegram_username text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_normalized_email text;
  v_normalized_first_name text;
  v_normalized_last_name text;
  v_normalized_telegram_username text;
begin
  -- Нормализуем данные
  v_normalized_email := lower(trim(p_email));
  v_normalized_first_name := trim(p_first_name);
  v_normalized_last_name := trim(p_last_name);
  v_normalized_telegram_username := trim(p_telegram_username);
  
  -- Если telegram_username указан, убираем @ если есть
  if v_normalized_telegram_username is not null and v_normalized_telegram_username != '' then
    v_normalized_telegram_username := regexp_replace(v_normalized_telegram_username, '^@', '');
  else
    v_normalized_telegram_username := null;
  end if;
  
  -- Проверяем, существует ли пользователь с таким email
  select id into v_user_id
  from public.users
  where email = v_normalized_email;

  if v_user_id is not null then
    -- Обновляем существующего пользователя
    update public.users
    set
      first_name = v_normalized_first_name,
      last_name = v_normalized_last_name,
      telegram_username = v_normalized_telegram_username,
      updated_at = now()
    where id = v_user_id;
    return v_user_id;
  else
    -- Создаём нового пользователя
    insert into public.users (
      id, email, first_name, last_name, telegram_username
    )
    values (
      p_user_id, v_normalized_email, v_normalized_first_name, v_normalized_last_name, v_normalized_telegram_username
    );
    return p_user_id;
  end if;
exception
  when unique_violation then
    -- Если email уже существует, обновляем существующего
    select id into v_user_id
    from public.users
    where email = v_normalized_email;
    if v_user_id is not null then
      update public.users
      set
        first_name = v_normalized_first_name,
        last_name = v_normalized_last_name,
        telegram_username = v_normalized_telegram_username,
        updated_at = now()
      where id = v_user_id;
      return v_user_id;
    end if;
    raise;
end;
$$;

revoke execute on function public.register_user(uuid, text, text, text, text) from public;
grant execute on function public.register_user(uuid, text, text, text, text) to service_role;

-- Важно: не даём вызывать функцию публично.
-- (Сайт вызывает её через service_role key на сервере.)
revoke execute on function public.record_attempt(uuid, text, int, int) from public;
grant execute on function public.record_attempt(uuid, text, int, int) to service_role;

-- 7) View: leaderboard
create or replace view public.leaderboard as
select
  us.user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.telegram_username,
  us.total_points,
  us.tests_completed,
  rank() over (
    order by us.total_points desc, us.updated_at asc, us.user_id asc
  ) as rank
from public.user_stats us
join public.users u on u.id = us.user_id;
