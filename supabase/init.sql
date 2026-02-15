-- ============================================
-- ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ
-- Выполните этот скрипт в PostgreSQL (psql или pgAdmin)
-- ============================================

-- 1) Расширения
create extension if not exists "pgcrypto";

-- 2) Таблицы (ВАЖНО: создаются в правильном порядке)

-- Таблица пользователей
drop table if exists public.attempts cascade;
drop table if exists public.user_stats cascade;
drop table if exists public.users cascade;

create table public.users (
  id uuid primary key,
  email text unique not null,
  first_name text not null check (char_length(first_name) between 1 and 50),
  last_name text not null check (char_length(last_name) between 1 and 50),
  telegram_username text check (telegram_username is null or char_length(telegram_username) between 1 and 32),
  password_hash text,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  banned_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Таблица статистики пользователей
create table public.user_stats (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_points bigint not null default 0,
  tests_completed int not null default 0,
  updated_at timestamptz not null default now()
);

-- Таблица попыток прохождения тестов
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  test_id text not null,
  score_percent int not null check (score_percent between 0 and 100),
  points_awarded int not null check (points_awarded >= 0),
  created_at timestamptz not null default now()
);

-- 3) Индексы
create index if not exists attempts_user_id_created_at_idx
  on public.attempts (user_id, created_at desc);

create index if not exists user_stats_total_points_idx
  on public.user_stats (total_points desc);

create index if not exists users_email_idx
  on public.users(email);

create index if not exists users_is_admin_idx
  on public.users(is_admin) where is_admin = true;

create index if not exists users_is_banned_idx
  on public.users(is_banned) where is_banned = true;

-- 4) Функция для автоматического обновления updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Триггеры для автоматического обновления updated_at
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

-- 5) Функция для записи попытки прохождения теста
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
  -- Находим предыдущую попытку по этому тесту для этого пользователя
  select points_awarded into v_previous_points
  from public.attempts
  where user_id = p_user_id
    and test_id = p_test_id
  order by created_at desc
  limit 1;

  -- Если предыдущей попытки нет, это новый тест
  if v_previous_points is null then
    v_is_new_test := true;
    v_previous_points := 0;
  end if;

  -- Вычисляем разницу очков
  v_points_delta := p_points_awarded - v_previous_points;

  -- Записываем новую попытку
  insert into public.attempts (user_id, test_id, score_percent, points_awarded)
  values (p_user_id, p_test_id, p_score_percent, p_points_awarded);

  -- Обновляем статистику пользователя
  insert into public.user_stats as us (user_id, total_points, tests_completed)
  values (p_user_id, v_points_delta, case when v_is_new_test then 1 else 0 end)
  on conflict on constraint user_stats_pkey do update
    set total_points = us.total_points + v_points_delta,
        tests_completed = us.tests_completed + case when v_is_new_test then 1 else 0 end,
        updated_at = now();

  -- Возвращаем обновленную статистику
  return query
  select us.user_id, us.total_points, us.tests_completed
  from public.user_stats us
  where us.user_id = p_user_id;
end;
$$;

-- 6) Функция для регистрации нового пользователя
create or replace function public.register_user(
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_telegram_username text,
  p_password_hash text DEFAULT NULL
)
returns uuid
language plpgsql
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
    -- Проверяем, что после нормализации username не пустой
    if v_normalized_telegram_username = '' then
      v_normalized_telegram_username := null;
    end if;
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
      password_hash = COALESCE(p_password_hash, password_hash),
      updated_at = now()
    where id = v_user_id;
    return v_user_id;
  else
    -- Создаём нового пользователя
    insert into public.users (
      id, email, first_name, last_name, telegram_username, password_hash
    )
    values (
      p_user_id, v_normalized_email, v_normalized_first_name, v_normalized_last_name, v_normalized_telegram_username, p_password_hash
    );
    return p_user_id;
  end if;
exception
  when unique_violation then
    -- Если email уже существует (race condition), обновляем существующего
    select id into v_user_id
    from public.users
    where email = v_normalized_email;
    if v_user_id is not null then
      update public.users
      set
        first_name = v_normalized_first_name,
        last_name = v_normalized_last_name,
        telegram_username = v_normalized_telegram_username,
        password_hash = COALESCE(p_password_hash, password_hash),
        updated_at = now()
      where id = v_user_id;
      return v_user_id;
    end if;
    raise;
end;
$$;

-- 7) Функция для проверки пароля пользователя
create or replace function public.verify_user_password(
  p_email text,
  p_password_hash text
)
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  telegram_username text
)
language plpgsql
set search_path = public
as $$
begin
  RETURN QUERY
  SELECT u.id, u.email, u.first_name, u.last_name, u.telegram_username
  FROM public.users u
  WHERE u.email = lower(trim(p_email))
    AND u.password_hash = p_password_hash;
END;
$$;

-- 8) View для рейтинга
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

-- 9) Таблица токенов сброса пароля
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_token_idx 
  on public.password_reset_tokens(token) 
  where used = false;

create index if not exists password_reset_tokens_user_id_idx 
  on public.password_reset_tokens(user_id);

-- 10) Таблицы для системы управления тестами (опционально)
create table if not exists public.tests (
  id text primary key,
  title text not null,
  description text,
  base_points int not null default 100,
  difficulty decimal(3,2) not null default 1.0,
  max_attempts int, -- null = без ограничений
  time_limit_minutes int, -- null = без ограничений
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Таблица вопросов
create table if not exists public.test_questions (
  id text primary key,
  test_id text not null references public.tests(id) on delete cascade,
  question_text text not null,
  question_order int not null,
  created_at timestamptz not null default now()
);

-- Таблица вариантов ответов
create table if not exists public.test_options (
  id text primary key,
  question_id text not null references public.test_questions(id) on delete cascade,
  option_text text not null,
  option_order int not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

-- Индексы для тестов
create index if not exists test_questions_test_id_idx on public.test_questions(test_id);
create index if not exists test_options_question_id_idx on public.test_options(question_id);
create index if not exists tests_is_active_idx on public.tests(is_active);

-- Триггер для обновления updated_at в tests
drop trigger if exists tests_set_updated_at on public.tests;
create trigger tests_set_updated_at
before update on public.tests
for each row
execute function public.set_updated_at();

-- ============================================
-- ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА
-- ============================================
