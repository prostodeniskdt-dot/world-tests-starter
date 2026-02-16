-- PostgreSQL (в т.ч. 18). Таблица для идемпотентности отправки тестов: одна и та же отправка не создаёт дубль попытки
-- Ключ генерируется на клиенте; ответ сохраняется на 48 часов

create table if not exists public.submit_idempotency (
  key uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  test_id text not null,
  response_body jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours')
);

create index if not exists submit_idempotency_user_expires_idx
  on public.submit_idempotency (user_id, expires_at);

comment on table public.submit_idempotency is 'Ключи идемпотентности для POST /api/submit; предотвращает двойной зачёт при повторной отправке';
