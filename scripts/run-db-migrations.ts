/**
 * Применяет миграции БД (админка, тесты, согласия, рейтинг) к PostgreSQL.
 * Подключение: DATABASE_URL из .env.local.
 *
 * Использование: npx tsx scripts/run-db-migrations.ts
 * или: npm run run-db-migrations
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

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

const MIGRATIONS_DIR = path.join(__dirname, "..", "db", "migrations");

const MIGRATION_FILES = [
  "add-admin-fields.sql",
  "add-tests-v2.sql",
  "20260216_tests_author.sql",
  "20260218_consent_and_deletion.sql",
  "20260223_add_attempt_answers.sql",
];

async function main() {
  console.log("=== Миграции БД (админка, тесты, согласия, рейтинг) ===\n");

  for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Файл не найден: ${filePath}`);
      process.exit(1);
    }
    const sql = fs.readFileSync(filePath, "utf-8");
    const name = file.replace(".sql", "");
    try {
      await pool.query(sql);
      console.log(`✓ ${name}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${name}: ${message}`);
      process.exit(1);
    }
  }

  console.log("\nВсе миграции применены успешно.");
}

main()
  .finally(() => pool.end());
