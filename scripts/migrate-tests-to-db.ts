/**
 * Скрипт миграции тестов из файлов (src/tests/) в базу данных.
 * 
 * Использование:
 *   npx tsx scripts/migrate-tests-to-db.ts
 * 
 * Перед запуском убедитесь:
 * 1. В .env.local указан DATABASE_URL
 * 2. Выполнена миграция supabase/migrations/add-tests-v2.sql
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";

// Загружаем .env.local
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

// Импортируем все тесты
// Для этого скрипта мы НЕ используем server-only, поэтому импортируем данные напрямую
// Нужно обойти проверку server-only - используем require

async function loadTests() {
  // Список тестов с метаданными
  const testDefs = [
    {
      id: "cocktail-base-1",
      publicPath: "../src/tests/cocktail-base-1/public",
      answerPath: "../src/tests/cocktail-base-1/answer",
      publicExport: "COCKTAIL_BASE_1_PUBLIC",
      answerExport: "COCKTAIL_BASE_1_SECRET",
    },
    {
      id: "cocktail-practice-2",
      publicPath: "../src/tests/cocktail-practice-2/public",
      answerPath: "../src/tests/cocktail-practice-2/answer",
      publicExport: "COCKTAIL_PRACTICE_2_PUBLIC",
      answerExport: "COCKTAIL_PRACTICE_2_SECRET",
    },
    {
      id: "cocktail-advanced-3",
      publicPath: "../src/tests/cocktail-advanced-3/public",
      answerPath: "../src/tests/cocktail-advanced-3/answer",
      publicExport: "COCKTAIL_ADVANCED_3_PUBLIC",
      answerExport: "COCKTAIL_ADVANCED_3_SECRET",
    },
    {
      id: "carbonization-base-1",
      publicPath: "../src/tests/carbonization-base-1/public",
      answerPath: "../src/tests/carbonization-base-1/answer",
      publicExport: "CARBONIZATION_BASE_1_PUBLIC",
      answerExport: "CARBONIZATION_BASE_1_SECRET",
    },
    {
      id: "carbonization-practice-2",
      publicPath: "../src/tests/carbonization-practice-2/public",
      answerPath: "../src/tests/carbonization-practice-2/answer",
      publicExport: "CARBONIZATION_PRACTICE_2_PUBLIC",
      answerExport: "CARBONIZATION_PRACTICE_2_SECRET",
    },
    {
      id: "carbonization-advanced-3",
      publicPath: "../src/tests/carbonization-advanced-3/public",
      answerPath: "../src/tests/carbonization-advanced-3/answer",
      publicExport: "CARBONIZATION_ADVANCED_3_PUBLIC",
      answerExport: "CARBONIZATION_ADVANCED_3_SECRET",
    },
    {
      id: "mixology-practice-2",
      publicPath: "../src/tests/mixology-practice-2/public",
      answerPath: "../src/tests/mixology-practice-2/answer",
      publicExport: "MIXOLOGY_PRACTICE_2_PUBLIC",
      answerExport: "MIXOLOGY_PRACTICE_2_SECRET",
    },
    {
      id: "mixology-advanced-3",
      publicPath: "../src/tests/mixology-advanced-3/public",
      answerPath: "../src/tests/mixology-advanced-3/answer",
      publicExport: "MIXOLOGY_ADVANCED_3_PUBLIC",
      answerExport: "MIXOLOGY_ADVANCED_3_SECRET",
    },
  ];

  const tests: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    difficultyLevel: number;
    basePoints: number;
    maxAttempts: number | null;
    questions: any[];
    answerKey: Record<string, any>;
  }> = [];

  for (const def of testDefs) {
    try {
      // Динамический импорт (tsx поддерживает)
      const publicMod = await import(def.publicPath);
      const answerMod = await import(def.answerPath);

      const pub = publicMod[def.publicExport];
      const ans = answerMod[def.answerExport];

      tests.push({
        id: pub.id,
        title: pub.title,
        description: pub.description,
        category: pub.category,
        difficultyLevel: pub.difficultyLevel,
        basePoints: ans.basePoints,
        maxAttempts: ans.maxAttempts ?? null,
        questions: pub.questions,
        answerKey: ans.answerKey,
      });

      console.log(`✓ Загружен тест: ${pub.id} (${pub.title})`);
    } catch (err) {
      console.error(`✗ Ошибка загрузки теста ${def.id}:`, err);
    }
  }

  return tests;
}

async function main() {
  console.log("=== Миграция тестов из файлов в БД ===\n");

  const tests = await loadTests();
  console.log(`\nЗагружено ${tests.length} тестов. Начинаем запись в БД...\n`);

  for (const test of tests) {
    try {
      await pool.query(
        `INSERT INTO tests (id, title, description, category, difficulty_level, base_points, max_attempts, questions, answer_key, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           difficulty_level = EXCLUDED.difficulty_level,
           base_points = EXCLUDED.base_points,
           max_attempts = EXCLUDED.max_attempts,
           questions = EXCLUDED.questions,
           answer_key = EXCLUDED.answer_key,
           is_published = true`,
        [
          test.id,
          test.title,
          test.description,
          test.category,
          test.difficultyLevel,
          test.basePoints,
          test.maxAttempts,
          JSON.stringify(test.questions),
          JSON.stringify(test.answerKey),
        ]
      );
      console.log(`✓ Записан в БД: ${test.id}`);
    } catch (err) {
      console.error(`✗ Ошибка записи ${test.id}:`, err);
    }
  }

  console.log("\n=== Миграция завершена ===");
  await pool.end();
}

main().catch((err) => {
  console.error("Критическая ошибка:", err);
  process.exit(1);
});
