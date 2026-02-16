/**
 * Обновляет answer_key теста «Давление, температура и баланс пузырьков»
 * (test-941e9b55) в БД, чтобы правильные ответы засчитывались корректно.
 *
 * Исправления:
 * - Вопрос matching (q1771242463408): ключ должен содержать 3 пары в 0-based
 *   формате (1–A, 2–B, 3–C) → [[0,0], [1,1], [2,2]]. Раньше в ключе было только
 *   две пары [[1,1],[2,2]], из-за чего правильный ответ с тремя парами не засчитывался.
 *
 * Использование:
 *   npx tsx scripts/fix-answer-keys-test-941e9b55.ts
 *
 * Требуется: .env.local с DATABASE_URL
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

const TEST_ID = "test-941e9b55";

const CORRECT_ANSWER_KEY: Record<string, unknown> = {
  q1771235748503: 1,
  q1771235814588: { answer: false, reason: 0 },
  q1771235857557: [0, 1, 2, 4, 5],
  q1771235929147: 1,
  q1771235994360: [1, 0, 2, 3],
  q1771236101438: 1,
  q1771236125987: [0, 0],
  q1771242260262: 1,
  q1771242334279: 1,
  q1771242391444: { answer: false, reason: 0 },
  q1771242463408: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  q1771242532418: 1,
};

async function main() {
  console.log(`=== Обновление answer_key для теста ${TEST_ID} ===\n`);

  const { rowCount } = await pool.query(
    `UPDATE tests SET answer_key = $1::jsonb WHERE id = $2`,
    [JSON.stringify(CORRECT_ANSWER_KEY), TEST_ID]
  );

  if (rowCount === 0) {
    console.error(`Тест с id "${TEST_ID}" не найден в БД.`);
    process.exit(1);
  }

  console.log(`✓ answer_key обновлён для теста "${TEST_ID}".`);
  await pool.end();
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
