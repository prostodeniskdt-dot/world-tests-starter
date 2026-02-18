-- Удаление аккаунтов, запрошенных 14 и более рабочих дней назад.
-- Запускать по cron раз в день (например в 03:00).
-- Рабочие дни: пн–пт (исключаем субботу 6 и воскресенье 0).

DELETE FROM public.users
WHERE delete_requested_at IS NOT NULL
  AND (
    SELECT count(*)::int
    FROM generate_series(
      (delete_requested_at::date),
      current_date,
      '1 day'
    ) AS d(day)
    WHERE extract(dow FROM d.day) NOT IN (0, 6)
  ) >= 14;
