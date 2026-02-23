/**
 * Удаляет из БД все тесты (таблица tests).
 * Использование: npx tsx scripts/delete-all-tests-from-db.ts
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
  const r = await pool.query("DELETE FROM tests RETURNING id");
  const count = r.rowCount ?? 0;
  console.log(`Из БД удалено тестов: ${count}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
