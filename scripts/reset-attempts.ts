/**
 * Удаляет историю попыток у всех игроков (очищает таблицу attempts).
 * Очки в user_stats при этом не меняются — чтобы обнулить и их, выполните после: npm run reset-points
 *
 * Подключение: DATABASE_URL из .env.local.
 * Использование: npx tsx scripts/reset-attempts.ts
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
  console.log("=== Сброс истории попыток (attempts) ===\n");

  await pool.query(`TRUNCATE TABLE public.attempts`);

  console.log("✓ История попыток у всех игроков удалена.");
  console.log("Чтобы обнулить также очки в рейтинге, выполните: npm run reset-points");
}

main()
  .catch((err) => {
    console.error("Ошибка:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
