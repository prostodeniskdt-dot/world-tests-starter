# Скрипты

## delete-accounts-after-14-working-days.sql

Удаляет из БД пользователей, запросивших удаление аккаунта 14 и более **рабочих** дней назад (пн–пт).

**Запуск:** по cron раз в день, например в 03:00:

```bash
psql $DATABASE_URL -f scripts/delete-accounts-after-14-working-days.sql
```

Или через pgAdmin / Supabase SQL Editor — выполнить содержимое файла.
