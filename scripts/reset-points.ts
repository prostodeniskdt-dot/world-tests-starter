/**
 * Начинает новый сезон рейтинга и обнуляет очки у всех пользователей.
 * История попыток сохраняется, но не влияет на новый сезон.
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
  console.log("=== Новый сезон рейтинга ===\n");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE public.points_seasons SET is_active = false WHERE is_active`
    );
    const seasonResult = await client.query(
      `INSERT INTO public.points_seasons (is_active) VALUES (true) RETURNING id, started_at`
    );
    const result = await client.query(
      `UPDATE public.user_stats SET total_points = 0, tests_completed = 0, updated_at = now()`
    );
    await client.query("COMMIT");

    console.log(`✓ Создан сезон: ${seasonResult.rows[0].id}`);
    console.log(`✓ Обновлено записей: ${result.rowCount ?? 0}`);
    console.log("Рейтинг обнулён, история попыток сохранена.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error("Ошибка:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
