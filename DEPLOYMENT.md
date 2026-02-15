# Инструкция по деплою King of the Bar

## ⚠️ Критично: Timeweb Cloud App Platform

**Не используйте шаблон «Next.js»** — он поддерживает только статическую генерацию. Приложение использует API routes и SSR, поэтому при деплое по шаблону «Next.js» сервер отдаёт HTML вместо JS-файлов → ошибка `Unexpected token '<'`.

**Используйте деплой через Dockerfile.**

### Шаги в панели Timeweb Cloud

1. App Platform → Создать
2. **Тип** → вкладка **Dockerfile**
3. Подключите репозиторий (GitHub/GitLab и т.д.)
4. В корне репозитория должен быть `Dockerfile`
5. Задайте переменные окружения (см. ниже)
6. Запустите деплой

## Переменные окружения (обязательно)

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Строка подключения PostgreSQL |
| `DB_SSL` | `true` для облачных БД (Timeweb и т.д.) |
| `JWT_SECRET` | Секретный ключ для JWT (любая длинная случайная строка) |
| `NEXT_PUBLIC_APP_URL` | URL сайта (например `https://your-app.twc1.net`) |

## Локальная проверка Docker

```bash
docker build -t king-of-the-bar .
docker run -p 8080:8080 -e DATABASE_URL="..." -e JWT_SECRET="..." -e DB_SSL=true king-of-the-bar
```

Откройте http://localhost:8080
