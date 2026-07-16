-- Энциклопедия сочетаний вкусов (импорт из xlsx в baza/)

CREATE TABLE IF NOT EXISTS public.flavor_encyclopedia_parts (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  pairings_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.flavor_encyclopedia_entries (
  id serial PRIMARY KEY,
  external_id text NOT NULL,
  part_id int NOT NULL REFERENCES public.flavor_encyclopedia_parts(id) ON DELETE CASCADE,
  main_section text NOT NULL,
  section_key text NOT NULL CHECK (
    section_key IN ('drinks', 'food', 'desserts', 'sauces', 'universal', 'other')
  ),
  base_ingredient text,
  ingredient_1 text NOT NULL,
  ingredient_2 text NOT NULL,
  original_1 text,
  original_2 text,
  group_1 text,
  group_2 text,
  aroma_profile_1 text,
  aroma_profile_2 text,
  compounds_1 text,
  compounds_2 text,
  mechanism_type text,
  explanation text,
  processing text,
  critical_points text,
  practical_application text,
  confidence text,
  sources text,
  pages text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (part_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_flavor_encyclopedia_entries_part
  ON public.flavor_encyclopedia_entries(part_id);

CREATE INDEX IF NOT EXISTS idx_flavor_encyclopedia_entries_section
  ON public.flavor_encyclopedia_entries(part_id, section_key);

CREATE INDEX IF NOT EXISTS idx_flavor_encyclopedia_entries_ingredient_1
  ON public.flavor_encyclopedia_entries(lower(ingredient_1));

CREATE INDEX IF NOT EXISTS idx_flavor_encyclopedia_entries_ingredient_2
  ON public.flavor_encyclopedia_entries(lower(ingredient_2));

CREATE INDEX IF NOT EXISTS idx_flavor_encyclopedia_entries_external
  ON public.flavor_encyclopedia_entries(external_id);

COMMENT ON TABLE public.flavor_encyclopedia_parts IS 'Части энциклопедии сочетаний (Цитрусовые, Ягоды, Специи и т.д.)';
COMMENT ON TABLE public.flavor_encyclopedia_entries IS 'Детальные записи сочетаний с научными объяснениями';
