# Схема и миграции БД (PostgreSQL)

Проект использует **PostgreSQL** (в т.ч. PostgreSQL 18 на Timeweb Cloud). Supabase не используется; подключение — через **DATABASE_URL** и драйвер `pg`.

## Структура

| Файл / папка | Назначение |
|--------------|------------|
| `init.sql` | Полная инициализация с нуля: таблицы `users`, `user_stats`, `attempts`, `consent_logs`, `password_reset_tokens`, `tests`, функции, view `leaderboard`. |
| `migrations/` | Миграции для уже существующей БД (добавление полей, новых таблиц, смена view). |

## Как применять

- **Новая база:** выполните `db/init.sql` в psql или в SQL-консоли панели хостинга (Timeweb и др.).
- **Уже есть база:** применяйте скрипты из `db/migrations/` по порядку (см. **MIGRATION_COMMANDS.md** в корне проекта).

Консольные команды для psql и примеры для Windows/Linux — в **MIGRATION_COMMANDS.md**.
