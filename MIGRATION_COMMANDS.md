# Консольные команды для миграции БД (PostgreSQL 18, Timeweb Cloud)

Подключение: **PostgreSQL** (в т.ч. на Timeweb Cloud, PostgreSQL 18). Все команды выполнять из **корня проекта**.

В `.env.local` должна быть переменная **DATABASE_URL** в формате:
```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```
Для Timeweb часто нужен SSL — при проблемах добавьте в URL `?sslmode=require` или задайте `DB_SSL=true` и используйте драйвер с SSL (приложение подключается с SSL, если `DB_SSL=true`).

---

## Вариант 1: Через psql (рекомендуется)

### Windows (PowerShell)

Загрузите переменные из `.env.local` и выполните SQL-файл:

```powershell
# Загрузка DATABASE_URL из .env.local (если есть)
Get-Content .env.local | ForEach-Object { if ($_ -match '^DATABASE_URL=(.+)$') { $env:DATABASE_URL = $matches[1].Trim() } }

# Полная инициализация с нуля (удаляет и создаёт таблицы заново)
psql $env:DATABASE_URL -f db/init.sql
```

Если `psql` не в PATH, укажите полный путь к нему или используйте **SQL-консоль в панели Timeweb**: откройте файл `db/init.sql` в редакторе, скопируйте содержимое и вставьте в консоль → Выполнить.

### Linux / macOS / WSL

```bash
# Инициализация с нуля
export $(grep -v '^#' .env.local | xargs)
psql "$DATABASE_URL" -f db/init.sql
```

---

## Вариант 2: Уже есть база, нужны только миграции

### Безопасный вариант (БД с тестами уже есть)

```bash
npm run run-db-migrations
```

Выполняет только инкрементальные миграции. **Не удаляет** таблицу `tests` и тесты.

### Первичная настройка (пустая БД, таблицы tests ещё нет)

Если `db/init.sql` уже выполнялся, но таблицы `tests` ещё нет, можно выполнить `add-tests-v2.sql` **отдельно**:

```bash
npm run run-initial-tests-schema
```

⚠️ **Внимание:** этот скрипт **удаляет** `tests`, `test_options`, `test_questions` и создаёт их заново. Использовать **только для пустой БД** или сознательного пересоздания схемы.

### Ручное выполнение (psql)

| Порядок | Команда | Назначение |
|--------|---------|------------|
| 1 | `psql $env:DATABASE_URL -f db/migrations/add-admin-fields.sql` | Поля админки и бана |
| 2 | `psql $env:DATABASE_URL -f db/migrations/add-tests-v2.sql` | ⚠️ Таблица тестов (УДАЛЯЕТ старую) |
| 3 | `psql $env:DATABASE_URL -f db/migrations/20260216_tests_author.sql` | Колонка author в tests |
| 4 | `psql $env:DATABASE_URL -f db/migrations/20260218_consent_and_deletion.sql` | Согласия, рейтинг, удаление аккаунта |

Остальные миграции — см. **DATABASE_COMMANDS.md**.

---

## Вариант 3: Timeweb Cloud — только SQL-консоль

Если доступа к `psql` нет:

1. Откройте панель Timeweb → ваша БД PostgreSQL → **SQL-консоль** (или «Выполнить SQL»).
2. Откройте в редакторе файл `db/init.sql`, скопируйте весь текст и вставьте в консоль → Выполнить.
3. Для **первичной** настройки по очереди выполните:
   - `db/migrations/add-admin-fields.sql`
   - `db/migrations/add-tests-v2.sql` ⚠️ удаляет старую таблицу tests
   - `db/migrations/20260216_tests_author.sql`
   - `db/migrations/20260218_consent_and_deletion.sql`
4. Если БД уже с тестами — используйте `npm run run-db-migrations` (не выполняйте add-tests-v2.sql вручную).

---

## Удаление аккаунтов через 14 рабочих дней

Скрипт удаляет пользователей, запросивших удаление 14+ рабочих дней назад. Запускайте раз в день (cron или вручную):

```powershell
psql $env:DATABASE_URL -f scripts/delete-accounts-after-14-working-days.sql
```

Подробнее — в **scripts/README.md**.
