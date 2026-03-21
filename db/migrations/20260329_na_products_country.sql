-- Страна производства / происхождения (есть в na_submissions и в approve-роуте)
ALTER TABLE public.na_products
  ADD COLUMN IF NOT EXISTS country text;
