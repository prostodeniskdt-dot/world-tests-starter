# Инструкция по настройке базы данных PostgreSQL

## Проблема: "relation public.users does not exist"

Если вы видите эту ошибку, значит таблицы в базе данных не были созданы.

## Решение: Выполните полную инициализацию

### Шаг 1: Подключитесь к PostgreSQL

Используйте psql, pgAdmin, DBeaver или другой клиент для подключения к вашей базе данных.

Пример подключения через psql:
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Шаг 2: Выполните скрипт инициализации

1. Откройте файл `supabase/init.sql` из этого проекта
2. Скопируйте **всё** содержимое файла
3. Выполните в SQL-клиенте

Или через psql:
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE" -f supabase/init.sql
```

### Шаг 3: Проверка

После выполнения скрипта проверьте:

1. **Таблицы созданы:**
   - `users`, `user_stats`, `attempts`, `password_reset_tokens`

2. **Функции созданы:**
   - `register_user`, `record_attempt`, `verify_user_password`, `set_updated_at`

3. **View создан:**
   - `leaderboard`

## Важно!

**Выполняйте весь скрипт целиком!** Не создавайте только функцию `register_user` - сначала должны быть созданы таблицы.

Скрипт `init.sql`:
- Создает все необходимые таблицы (включая поля is_admin, is_banned)
- Создает все функции
- Создает индексы и триггеры
- Создает view для рейтинга

## Настройка подключения

В файле `.env.local` укажите строку подключения:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DB_SSL="true"  # для облачных провайдеров
```

---

После выполнения скрипта и настройки переменных окружения приложение должно работать корректно!
