/**
 * Включает отображение в рейтинге для всех существующих пользователей
 * (consent_public_rating = true). Данные user_stats/attempts не трогаем.
 * Однократный запуск после миграции 20260218.
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL не найден в .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function main() {
  const r = await pool.query(
    "UPDATE users SET consent_public_rating = true WHERE consent_public_rating = false RETURNING id"
  );
  console.log(`Рейтинг: включено отображение для ${r.rowCount ?? 0} пользователей.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
