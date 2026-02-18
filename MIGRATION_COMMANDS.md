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

Если `db/init.sql` уже выполнялся раньше (или база создана вручную), применяйте миграции **по порядку**:

| Порядок | Команда (PowerShell) | Назначение |
|--------|----------------------|------------|
| 1 | `psql $env:DATABASE_URL -f db/migrations/add-admin-fields.sql` | Поля админки и бана |
| 2 | `psql $env:DATABASE_URL -f db/migrations/add-tests-v2.sql` | Таблица тестов с JSONB |
| 3 | `psql $env:DATABASE_URL -f db/migrations/20260216_tests_author.sql` | Колонка author в tests |
| 4 | `psql $env:DATABASE_URL -f db/migrations/20260218_consent_and_deletion.sql` | Согласия, рейтинг без email, удаление аккаунта |

Остальные миграции в `db/migrations/` (очки, идемпотентность, fix record_attempt) — по необходимости, см. **DATABASE_COMMANDS.md**.

**Одна команда подряд (PowerShell):**

```powershell
Get-Content .env.local | ForEach-Object { if ($_ -match '^DATABASE_URL=(.+)$') { $env:DATABASE_URL = $matches[1].Trim() } }
psql $env:DATABASE_URL -f db/migrations/add-admin-fields.sql
psql $env:DATABASE_URL -f db/migrations/add-tests-v2.sql
psql $env:DATABASE_URL -f db/migrations/20260216_tests_author.sql
psql $env:DATABASE_URL -f db/migrations/20260218_consent_and_deletion.sql
```

---

## Вариант 3: Timeweb Cloud — только SQL-консоль

Если доступа к `psql` нет:

1. Откройте панель Timeweb → ваша БД PostgreSQL → **SQL-консоль** (или «Выполнить SQL»).
2. Откройте в редакторе файл `db/init.sql`, скопируйте весь текст и вставьте в консоль → Выполнить.
3. Затем по очереди откройте и выполните:
   - `db/migrations/add-admin-fields.sql`
   - `db/migrations/add-tests-v2.sql`
   - `db/migrations/20260216_tests_author.sql`
   - `db/migrations/20260218_consent_and_deletion.sql`

---

## Удаление аккаунтов через 14 рабочих дней

Скрипт удаляет пользователей, запросивших удаление 14+ рабочих дней назад. Запускайте раз в день (cron или вручную):

```powershell
psql $env:DATABASE_URL -f scripts/delete-accounts-after-14-working-days.sql
```

Подробнее — в **scripts/README.md**.
