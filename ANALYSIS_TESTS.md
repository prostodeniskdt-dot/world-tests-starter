# Анализ: пропавшие тесты и миграция данных

## Краткий вывод

**Причина:** При переходе на новую PostgreSQL‑базу выполнялись только SQL‑миграции (`init.sql`, `add-admin-fields.sql`, `add-tests-v2.sql`). Они создают пустую таблицу `tests`. **Скрипт миграции тестов из файлов в БД (`migrate-tests-to-db.ts`) не запускался**, поэтому данные в таблицу не попали.

---

## Как устроена система тестов

### 1. Где хранятся тесты

- **БД:** таблица `tests` (PostgreSQL) — сюда загружает данные приложение.
- **Исходники:** `src/tests/` — 8 тестов в TypeScript.

### 2. Как приложение получает тесты

- `src/lib/tests-registry.ts` читает тесты **только из БД** через `db.query()`.
- Файлы в `src/tests/` приложением не используются напрямую.

### 3. Как тесты попадают в БД

- Скрипт `scripts/migrate-tests-to-db.ts` читает тесты из `src/tests/` и записывает их в `tests`.
- Запуск: `npm run migrate-tests` или `npx tsx scripts/migrate-tests-to-db.ts`.
- В `DEPLOYMENT.md` этот шаг не был описан.

---

## Что есть в репозитории

### Тесты в `src/tests/` (8 штук)

| ID | Название |
|----|----------|
| cocktail-base-1 | Лёд, проценты и прозрачность |
| cocktail-practice-2 | ... |
| cocktail-advanced-3 | ... |
| carbonization-base-1 | ... |
| carbonization-practice-2 | ... |
| carbonization-advanced-3 | ... |
| mixology-practice-2 | ... |
| mixology-advanced-3 | ... |

(Указаны все 8 из `migrate-tests-to-db.ts`; 9‑й тест в скрипте не описан.)

### Редактор и импорт

- Редактор тестов: `/admin/tests/[testId]/edit`
- Импорт из JSON: `/admin/tests/import` — вставка JSON в форму, валидация, сохранение через `POST /api/admin/tests`.

---

## Что было сделано при переносе

1. Создана новая PostgreSQL‑база на Timeweb.
2. Выполнены: `init.sql` → `add-admin-fields.sql` → `add-tests-v2.sql`.
3. `migrate-tests-to-db.ts` не запускался.

Результат: таблица `tests` создана, но пуста.

---

## Решение

Миграция **выполнена**: 8 тестов перенесены в БД.

Для повторного запуска или переноса в новую БД:

```bash
npm run migrate-tests
```

Скрипт берёт `DATABASE_URL` из `.env.local`, читает тесты из `src/tests/` и вставляет их в таблицу `tests` (с `ON CONFLICT DO UPDATE`).

**Важно:** В `.env.local` должен быть `DATABASE_URL` той БД, которую использует приложение. Для локального запуска миграции с подключением к прод-БД используйте ту же строку, что и в переменных окружения на Timeweb (при необходимости с IP вместо хоста).
