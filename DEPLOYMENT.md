# Развёртывание King of the Bar на Timeweb Cloud

Приложение: **Next.js** (Node.js 24) + **PostgreSQL**. Сайт с тестами, пользователями и рейтингом. Для работы нужны API routes и серверный рендеринг — **не подходит статический экспорт**.

## Важно: способ деплоя на Timeweb

**Не используйте шаблон «Next.js»** в App Platform — он рассчитан на статическую генерацию. У этого приложения есть API (авторизация, тесты, рейтинг, админка), поэтому при деплое по шаблону «Next.js» сервер отдаёт HTML вместо JS → ошибка `Unexpected token '<'`.

**Используйте деплой через Dockerfile** (вкладка «Dockerfile» при создании приложения).

---

## 1. База данных PostgreSQL на Timeweb

1. В панели Timeweb Cloud: **Базы данных** → создать базу **PostgreSQL**.
2. Запомните или скачайте строку подключения в формате:
   ```text
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```
3. Для облачной БД обязательно используется **SSL**. Пароль в URL может содержать спецсимволы — при необходимости кодируйте их (например, `@` → `%40`).

---

## 2. Инициализация схемы БД (один раз)

Подключитесь к своей PostgreSQL (через панель Timeweb «SQL-консоль» или `psql`) и выполните скрипты **строго по порядку**:

| № | Файл | Назначение |
|---|------|------------|
| 1 | `supabase/init.sql` | Таблицы пользователей, статистики, попыток, рейтинг, сброс пароля, функции |
| 2 | `supabase/migrations/add-admin-fields.sql` | Поля админки и бана в `users` |
| 3 | `supabase/migrations/add-tests-v2.sql` | Таблица тестов с JSONB (вместо старых `test_questions` / `test_options`) |
| 4 | `supabase/migrations/fix-record-attempt-ambiguous.sql` | Исправление ambiguous `user_id` в record_attempt, права админа |

После выполнения приложение будет использовать одну и ту же схему, что и локально (PostgreSQL на Timeweb совместим с этими скриптами).

---

## 2.1. Миграция тестов в БД (один раз)

После создания таблицы `tests` нужно заполнить её тестами из репозитория:

```bash
npm run migrate-tests
```

Скрипт читает тесты из `src/tests/` и вставляет их в таблицу. Требуется `DATABASE_URL` в `.env.local` (укажите строку подключения к вашей БД, при необходимости с IP вместо хоста).

---

## 3. Деплой приложения (Dockerfile)

1. **App Platform** → **Создать приложение**.
2. Выберите вкладку **Dockerfile** (не шаблон «Next.js»).
3. Подключите репозиторий (GitHub / GitLab и т.д.). В корне должен быть файл **`Dockerfile`**.
4. Укажите:
   - **Среда**: Node.js 24 (образ в Dockerfile уже на `node:24-alpine`).
   - Порт приложения: **8080** (в Dockerfile задано `EXPOSE 8080` и `PORT=8080`).

### Переменные окружения (обязательно)

Задайте их в настройках приложения в панели Timeweb:

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Строка подключения PostgreSQL (из шага 1) |
| `DB_SSL` | `true` — для облачной БД Timeweb |
| `JWT_SECRET` | Секрет для JWT (длинная случайная строка) |
| `NEXT_PUBLIC_APP_URL` | URL сайта после деплоя (например `https://your-app.twc1.net`) |

Пример `DATABASE_URL`:

```text
postgresql://gen_user:YourPassword%40@xxxxx.twc1.net:5432/default_db
```

5. Запустите сборку и деплой. После успешного деплоя сайт будет доступен по выданному URL.

---

## 4. Локальная проверка образа

```bash
docker build -t king-of-the-bar .
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e DB_SSL=true \
  -e JWT_SECRET="your-secret" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:8080" \
  king-of-the-bar
```

Откройте в браузере: http://localhost:8080

---

## 5. Чек-лист перед продакшеном

- [ ] В панели Timeweb создана БД PostgreSQL, скопирована `DATABASE_URL`.
- [ ] Выполнены скрипты: `init.sql` → `add-admin-fields.sql` → `add-tests-v2.sql`.
- [ ] Запущена миграция тестов: `npm run migrate-tests` (при необходимости укажите в `.env.local` IP вместо хоста).
- [ ] Деплой идёт через **Dockerfile**, не через шаблон «Next.js».
- [ ] Заданы переменные: `DATABASE_URL`, `DB_SSL=true`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`.
- [ ] `NEXT_PUBLIC_APP_URL` указывает на итоговый HTTPS-адрес сайта (например `https://your-app.twc1.net`).

После этого сайт с тестами, пользователями и рейтингом будет работать на Timeweb Cloud как полноценное приложение с PostgreSQL.
