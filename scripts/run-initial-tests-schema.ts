/**
 * Первичная настройка таблицы tests (ТОЛЬКО для пустой БД).
 *
 * ⚠️ ОПАСНО: Этот скрипт УДАЛЯЕТ таблицы test_options, test_questions, tests
 * и создаёт их заново. ВСЕ ТЕСТЫ БУДУТ УТЕРЯНЫ.
 *
 * Использовать ТОЛЬКО когда:
 * - База новая и таблица tests ещё не создана, ИЛИ
 * - Вы сознательно хотите пересоздать пустую таблицу tests.
 *
 * Для инкрементальных миграций на существующей БД: npm run run-db-migrations
 *
 * Запуск: npx tsx scripts/run-initial-tests-schema.ts
 * или: npm run run-initial-tests-schema
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as readline from "readline";

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

const MIGRATION_FILE = "add-tests-v2.sql";

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  ⚠️  ВНИМАНИЕ: Эта миграция УДАЛИТ таблицу tests и все тесты!  ║");
  console.log("║  Используйте только для пустой БД или пересоздания схемы.       ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("");

  const force = process.argv.includes("--force");
  if (!force) {
    const answer = await ask("Введите 'YES' для подтверждения: ");
    if (answer !== "YES") {
      console.log("Отменено.");
      process.exit(0);
    }
  }

  const filePath = path.join(__dirname, "..", "db", "migrations", MIGRATION_FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`Файл не найден: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, "utf-8");
  try {
    await pool.query(sql);
    console.log(`✓ ${MIGRATION_FILE} выполнен. Таблица tests создана (пустая).`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`✗ Ошибка: ${message}`);
    process.exit(1);
  }
}

main()
  .finally(() => pool.end());
