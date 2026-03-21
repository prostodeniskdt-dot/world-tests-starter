/**
 * Вставка базовых категорий базы знаний (идемпотентно).
 * Использование: npx tsx scripts/seed-knowledge-categories.ts
 * Требуется DATABASE_URL в .env.local (как у run-db-migrations).
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL не найден. Добавьте в .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const SQL = `
INSERT INTO public.knowledge_categories (name, slug, sort_order) VALUES
  ('Техника', 'technika', 10),
  ('Рецепты', 'recepty', 20),
  ('Юридическое', 'yuridicheskoe', 30),
  ('Бизнес', 'biznes', 40),
  ('Авторское', 'avtorskoe', 50)
ON CONFLICT (slug) DO NOTHING;
`;

async function main() {
  console.log("Вставка категорий knowledge_categories…");
  await pool.query(SQL);
  const { rows } = await pool.query(
    `SELECT id, name, slug FROM public.knowledge_categories ORDER BY sort_order, id`
  );
  console.log("Текущие категории:", rows);
  console.log("Готово.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
