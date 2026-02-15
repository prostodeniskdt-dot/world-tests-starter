import "server-only";
import { db } from "@/lib/db";
import type { PublicTest, PublicTestQuestion } from "@/tests/types";

// Экспортируем типы
export type { PublicTest, PublicTestQuestion } from "@/tests/types";

// Тип секретного теста
export type SecretTest = {
  id: string;
  basePoints: number;
  difficulty: number;
  maxAttempts: number | null;
  answerKey: Record<string, any>;
};

// === Функции загрузки из БД ===

/** Получить все опубликованные тесты (публичная часть, без ответов) */
export async function getPublicTests(): Promise<PublicTest[]> {
  const { rows } = await db.query(
    `SELECT id, title, description, category, difficulty_level, questions
     FROM tests WHERE is_published = true ORDER BY category, difficulty_level`
  );
  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    difficultyLevel: r.difficulty_level,
    questions: r.questions as PublicTestQuestion[],
  }));
}

/** Получить публичный тест по ID */
export async function getPublicTest(testId: string): Promise<PublicTest | null> {
  const { rows } = await db.query(
    `SELECT id, title, description, category, difficulty_level, questions
     FROM tests WHERE id = $1 AND is_published = true LIMIT 1`,
    [testId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    difficultyLevel: r.difficulty_level,
    questions: r.questions as PublicTestQuestion[],
  };
}

/** Получить секретный тест по ID (с ответами) */
export async function getSecretTest(testId: string): Promise<SecretTest | null> {
  const { rows } = await db.query(
    `SELECT id, base_points, difficulty_level, max_attempts, answer_key
     FROM tests WHERE id = $1 AND is_published = true LIMIT 1`,
    [testId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    basePoints: r.base_points,
    difficulty: r.difficulty_level,
    maxAttempts: r.max_attempts,
    answerKey: r.answer_key as Record<string, any>,
  };
}

/** Получить категории */
export async function getCategories(): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT category FROM tests WHERE is_published = true ORDER BY category`
  );
  return rows.map((r: any) => r.category);
}

/** Получить тесты по категориям */
export async function getTestsByCategory(): Promise<Record<string, PublicTest[]>> {
  const tests = await getPublicTests();
  const result: Record<string, PublicTest[]> = {};
  for (const test of tests) {
    if (!result[test.category]) result[test.category] = [];
    result[test.category].push(test);
  }
  return result;
}
