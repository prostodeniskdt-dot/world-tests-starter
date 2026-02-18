-- Удаление старой версии record_attempt (4 параметра), чтобы осталась только версия с 5 параметрами.
-- Иначе при вызове record_attempt(...) PostgreSQL выдаёт "function is not unique".

drop function if exists public.record_attempt(uuid, text, int, int);
