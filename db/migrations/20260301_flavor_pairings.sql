-- Миграция: таблица сочетаний вкусов (из PDF "Таблица сочетания")
-- Только добавление, без изменения существующих таблиц

CREATE TABLE IF NOT EXISTS public.flavor_pairings (
  id serial PRIMARY KEY,
  main_ingredient text NOT NULL,
  paired_ingredient text NOT NULL,
  main_category text NOT NULL CHECK (main_category IN ('fruits', 'herbs_spices', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(main_ingredient, paired_ingredient)
);

CREATE INDEX IF NOT EXISTS idx_flavor_pairings_main ON public.flavor_pairings(main_ingredient);
CREATE INDEX IF NOT EXISTS idx_flavor_pairings_main_category ON public.flavor_pairings(main_category);
CREATE INDEX IF NOT EXISTS idx_flavor_pairings_paired ON public.flavor_pairings(paired_ingredient);

COMMENT ON TABLE public.flavor_pairings IS 'Сочетания ингредиентов из PDF Таблица сочетания для справочника, конструктора и игры';
