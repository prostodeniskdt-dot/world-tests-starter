/**
 * Применяет безопасные инкрементальные миграции БД к PostgreSQL.
 * Подключение: DATABASE_URL из .env.local.
 *
 * ⚠️ ВАЖНО: Этот скрипт НЕ выполняет add-tests-v2.sql (удаляет таблицу tests).
 * Для первичной настройки пустой БД используйте scripts/run-initial-tests-schema.ts.
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

/** Миграции, удаляющие tests — ЗАПРЕЩЕНО включать сюда */
const FORBIDDEN_IN_MAIN_MIGRATIONS = [
  "add-tests-v2.sql",
];

/** Паттерны, при обнаружении которых миграция блокируется (защита таблицы tests) */
const FORBIDDEN_PATTERNS = [
  /\bDROP\s+TABLE\s+.*\btests\b/i,
  /\bTRUNCATE\s+.*\btests\b/i,
  /\bDROP\s+TABLE\s+.*\btest_options\b/i,
  /\bDROP\s+TABLE\s+.*\btest_questions\b/i,
];

const MIGRATION_FILES = [
  "add-admin-fields.sql",
  "20260216_tests_author.sql",
  "20260218_consent_and_deletion.sql",
  "20260223_add_attempt_answers.sql",
  "20260301_flavor_pairings.sql",
  "20260320_catalogs.sql",
  "20260321_knowledge_ugc_enhancements.sql",
  "20260321_user_profile_assets.sql",
  "20260322_knowledge_practice_test.sql",
  "20260323_user_profile_bio.sql",
  "20260324_alcohol_cocktails_mvp.sql",
  "20260325_alcohol_ugc.sql",
  "20260326_alcohol_drink_types.sql",
  "20260327_na_ingredients_ugc.sql",
  "20260327_cocktails_author_rework.sql",
  "20260328_technique_skills.sql",
  "20260329_na_products_country.sql",
  "20260330_glassware_full.sql",
  "20260328_cocktails_author_model_v2.sql",
];

function isMigrationSafe(sql: string, fileName: string): { safe: boolean; reason?: string } {
  if (FORBIDDEN_IN_MAIN_MIGRATIONS.includes(fileName)) {
    return { safe: false, reason: `Миграция ${fileName} удаляет таблицу tests. Используйте run-initial-tests-schema.ts только для пустой БД.` };
  }
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(sql)) {
      return { safe: false, reason: `Миграция содержит запрещённую операцию над таблицей tests: ${pattern}` };
    }
  }
  return { safe: true };
}

async function main() {
  console.log("=== Безопасные миграции БД ===\n");
  console.log("(add-tests-v2.sql не выполняется — он удаляет tests. Для пустой БД: npm run run-initial-tests-schema)\n");

  for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Файл не найден: ${filePath}`);
      process.exit(1);
    }
    const sql = fs.readFileSync(filePath, "utf-8");
    const name = file.replace(".sql", "");

    const safety = isMigrationSafe(sql, file);
    if (!safety.safe) {
      console.error(`✗ БЛОКИРОВКА: ${safety.reason}`);
      process.exit(1);
    }

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
