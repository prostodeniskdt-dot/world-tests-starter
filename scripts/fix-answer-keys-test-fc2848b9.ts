/**
 * Обновляет answer_key теста «Равновесие, дегазация и управление системой карбонизации»
 * (test-fc2848b9) в БД, чтобы правильные ответы засчитывались корректно.
 *
 * Исправления:
 * - Вопрос 5 (multiple-choice): правильный ответ C = индекс 2 (было 1).
 * - Вопрос 8 (cloze-dropdown): правильные ответы [0, 1] — «угольной кислоты», «гидратации» (было [0, 0]).
 * - Вопрос 4 (matching): ключ [ [0,0], [1,2], [2,1] ] в 0-based формате (1-A, 2-C, 3-B).
 *
 * Использование:
 *   npx tsx scripts/fix-answer-keys-test-fc2848b9.ts
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

const TEST_ID = "test-fc2848b9";

const CORRECT_ANSWER_KEY: Record<string, unknown> = {
  q1771254907917: 1,
  q1771254931003: [0, 1, 2, 4],
  q1771254958926: { answer: false, reason: 0 },
  q1771255011091: [
    [0, 0],
    [1, 2],
    [2, 1],
  ],
  q1771255070325: 2,
  q1771255095578: [2, 1, 0, 3],
  q1771255135146: 1,
  q1771255152147: [0, 1],
  q1771255226435: [0, 1, 3],
  q1771255246319: 0,
  q1771255276637: [1, 2, 3],
  q1771255317456: 2,
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
