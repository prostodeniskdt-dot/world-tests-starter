/**
 * Выполняет миграцию fix-record-attempt-ambiguous.sql и выдаёт права админа.
 * Использование: npx tsx scripts/run-fix-migration.ts
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

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
  console.log("=== Применение исправлений ===\n");

  const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "fix-record-attempt-ambiguous.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  try {
    await pool.query(sql);
    console.log("✓ Миграция применена успешно");
    console.log("✓ record_attempt исправлен (ambiguous user_id)");
    console.log("✓ Права админа выданы для prostodeniskdt@gmail.com");
  } catch (err: any) {
    console.error("Ошибка:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
