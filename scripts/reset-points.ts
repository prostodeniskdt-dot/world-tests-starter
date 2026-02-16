/**
 * Обнуляет очки и счётчик пройденных тестов у всех пользователей (таблица user_stats).
 * История попыток (attempts) не удаляется.
 *
 * Подключение: DATABASE_URL из .env.local.
 * Использование: npx tsx scripts/reset-points.ts
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

async function main() {
  console.log("=== Сброс очков (user_stats) ===\n");

  const result = await pool.query(
    `UPDATE public.user_stats SET total_points = 0, tests_completed = 0, updated_at = now()`
  );

  console.log(`✓ Обновлено записей: ${result.rowCount ?? 0}`);
  console.log("Очки и счётчик тестов у всех пользователей обнулены. Обновите страницу рейтинга.");
}

main()
  .catch((err) => {
    console.error("Ошибка:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
