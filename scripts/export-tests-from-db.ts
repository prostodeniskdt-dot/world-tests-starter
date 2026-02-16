/**
 * Экспорт тестов из БД в репозиторий (src/tests/{testId}/).
 * Сохраняет структуру вопросов и answerKey без изменений — механики не затрагиваются.
 *
 * Использование:
 *   npx tsx scripts/export-tests-from-db.ts
 *
 * Требуется: .env.local с DATABASE_URL
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

const TESTS_DIR = path.resolve(process.cwd(), "src", "tests");

function testIdToConstantName(id: string): string {
  return id.replace(/-/g, "_").toUpperCase();
}

/** Клонируем и отдаём только нужные поля, не трогая вложенные questions/answer_key */
function buildPublicFromRow(r: {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty_level: number;
  questions: unknown;
}): Record<string, unknown> {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    category: r.category,
    difficultyLevel: r.difficulty_level,
    questions: r.questions,
  };
}

function buildSecretFromRow(r: {
  id: string;
  base_points: number;
  difficulty_level: number;
  max_attempts: number | null;
  answer_key: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    id: r.id,
    basePoints: r.base_points,
    difficulty: r.difficulty_level,
    maxAttempts: r.max_attempts,
    answerKey: r.answer_key,
  };
}

async function main() {
  console.log("=== Экспорт тестов из БД в репозиторий ===\n");

  const { rows } = await pool.query(
    `SELECT id, title, description, category, difficulty_level, base_points, max_attempts, questions, answer_key
     FROM tests ORDER BY category, difficulty_level`
  );

  if (rows.length === 0) {
    console.log("В БД нет тестов. Завершение.");
    await pool.end();
    return;
  }

  const exportedIds = new Set<string>();

  for (const r of rows) {
    const id = r.id as string;
    const constName = testIdToConstantName(id);
    const dir = path.join(TESTS_DIR, id);

    fs.mkdirSync(dir, { recursive: true });

    const publicObj = buildPublicFromRow(r);
    const publicTs =
      `import type { PublicTest } from "../types";\n\n` +
      `export const ${constName}_PUBLIC = ${JSON.stringify(publicObj, null, 2)} as PublicTest;\n`;
    fs.writeFileSync(path.join(dir, "public.ts"), publicTs, "utf-8");

    const secretObj = buildSecretFromRow(r);
    const answerTs =
      `import "server-only";\n\n` +
      `/**\n * ВНИМАНИЕ:\n * Этот файл нельзя импортировать в клиентские компоненты,\n * иначе правильные ответы утекут в браузер.\n */\n\n` +
      `export const ${constName}_SECRET = ${JSON.stringify(secretObj, null, 2)};\n`;
    fs.writeFileSync(path.join(dir, "answer.ts"), answerTs, "utf-8");

    exportedIds.add(id);
    console.log(`✓ Экспортирован: ${id} (${r.title})`);
  }

  // Удаляем из репо папки тестов, которых нет в БД
  if (fs.existsSync(TESTS_DIR)) {
    const dirs = fs.readdirSync(TESTS_DIR);
    for (const name of dirs) {
      const fullPath = path.join(TESTS_DIR, name);
      if (!fs.statSync(fullPath).isDirectory()) continue;
      if (exportedIds.has(name)) continue;
      fs.rmSync(fullPath, { recursive: true });
      console.log(`✓ Удалена устаревшая папка: src/tests/${name}`);
    }
  }

  console.log(`\n=== Готово: экспортировано ${rows.length} тестов ===`);
  await pool.end();
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
