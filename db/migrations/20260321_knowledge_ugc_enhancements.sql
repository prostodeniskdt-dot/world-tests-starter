-- Расширение UGC базы знаний: категории в заявках, обложка, начальные категории

ALTER TABLE public.article_submissions
  ADD COLUMN IF NOT EXISTS category_id int REFERENCES public.knowledge_categories(id) ON DELETE SET NULL;

ALTER TABLE public.article_submissions
  ADD COLUMN IF NOT EXISTS cover_image_url text;

ALTER TABLE public.knowledge_articles
  ADD COLUMN IF NOT EXISTS cover_image_url text;

INSERT INTO public.knowledge_categories (name, slug, sort_order) VALUES
  ('Техника', 'technika', 10),
  ('Рецепты', 'recepty', 20),
  ('Юридическое', 'yuridicheskoe', 30),
  ('Бизнес', 'biznes', 40),
  ('Авторское', 'avtorskoe', 50)
ON CONFLICT (slug) DO NOTHING;
