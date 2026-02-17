# Команды для работы с базой данных (PostgreSQL)

Подключение к БД берётся из `.env.local` (`DATABASE_URL`). Все скрипты запускаются из **корня проекта**.

---

## Колонка «Автор» в таблице тестов

Чтобы в редакторе и на сайте работало поле «Автор» теста, примените миграцию:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260216_tests_author.sql
```

(или выполните SQL из файла вручную в вашем клиенте БД). После этого в таблице `tests` появится колонка `author` (текст, по умолчанию пустая строка).

---

## Миграции системы очков

Применить миграции (схема БД: функция `record_attempt`, таблица `submit_idempotency`, колонка `attempts.idempotency_key`, удаление старой версии функции). Очки при этом **не** обнуляются.

```bash
npm run run-points-migrations
```

или:

```bash
npx tsx scripts/run-points-migrations.ts
```

---

## Обнуление очков у всех пользователей

Обнуляет в таблице `user_stats` поля `total_points` и `tests_completed`. История попыток (`attempts`) **не** удаляется.

```bash
npm run reset-points
```

или:

```bash
npx tsx scripts/reset-points.ts
```

---

## Сброс истории попыток у всех игроков

Очищает таблицу `attempts` — у всех игроков пропадает история прохождений. Очки в рейтинге (`user_stats`) при этом **не** меняются. Чтобы обнулить и очки, после этой команды выполните `npm run reset-points`.

```bash
npm run reset-attempts
```

или:

```bash
npx tsx scripts/reset-attempts.ts
```

---

## Полный сброс рейтинга и истории

Сначала сбросить историю попыток, затем обнулить очки:

```bash
npm run reset-attempts
npm run reset-points
```

---

## Старая миграция (fix record_attempt ambiguous)

Исправление колонки в `record_attempt` и выдача прав админа (если используете этот скрипт):

```bash
npm run run-fix-migration
```

или:

```bash
npx tsx scripts/run-fix-migration.ts
```

---

## Прямой SQL (через psql)

Если нужно выполнить свой запрос, подставьте свой `DATABASE_URL`:

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -c "ВАШ_SQL"
```

Пример — обнулить только очки без скрипта:

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -c "UPDATE public.user_stats SET total_points = 0, tests_completed = 0, updated_at = now();"
```

---

## Сборка и запуск приложения

После изменений в БД приложение перезапускать не обязательно (миграции и сбросы действуют сразу). Для деплоя:

```bash
npm install
npm run build
npm run start
```

Режим разработки:

```bash
npm run dev
```
