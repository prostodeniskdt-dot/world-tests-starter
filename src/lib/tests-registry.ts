import "server-only";
import { db } from "@/lib/db";
import { normalizeTestContentFromDb } from "@/lib/test-runtime-normalize";
import type { PublicTest } from "@/tests/types";

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

/** Контекст доступа к каталогу и прохождению тестов */
export type TestAccessContext = {
  userId: string | null;
  isAdmin: boolean;
};

const defaultAccess: TestAccessContext = { userId: null, isAdmin: false };

function mapPublicRow(r: {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: number;
  author?: string | null;
  questions: unknown;
}): PublicTest {
  const { questions } = normalizeTestContentFromDb(r.questions, {});
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    difficultyLevel: r.difficulty_level as 1 | 2 | 3,
    author: r.author ? String(r.author) : undefined,
    questions,
  };
}

function publishedAccessSql(alias: string): string {
  return `(
    COALESCE(${alias}.visibility, 'public') = 'public'
    OR $1 = true
    OR ($2::uuid IS NOT NULL AND EXISTS (
      SELECT 1 FROM test_user_access tua
      WHERE tua.test_id = ${alias}.id AND tua.user_id = $2::uuid
    ))
  )`;
}

// === Функции загрузки из БД ===

/** Получить все опубликованные тесты, доступные в каталоге для данного контекста */
export async function getPublicTests(ctx: TestAccessContext = defaultAccess): Promise<PublicTest[]> {
  const { userId, isAdmin } = ctx;
  const { rows } = await db.query(
    `SELECT t.id, t.title, t.description, t.category, t.difficulty_level, t.author, t.questions
     FROM tests t
     WHERE t.is_published = true
       AND ${publishedAccessSql("t")}
     ORDER BY t.category, t.difficulty_level`,
    [isAdmin, userId]
  );
  return rows.map((r: any) => mapPublicRow(r));
}

/** Получить публичный тест по ID (с учётом restricted и списка доступа) */
export async function getPublicTest(
  testId: string,
  ctx: TestAccessContext = defaultAccess
): Promise<PublicTest | null> {
  const { userId, isAdmin } = ctx;
  const { rows } = await db.query(
    `SELECT t.id, t.title, t.description, t.category, t.difficulty_level, t.author, t.questions
     FROM tests t
     WHERE t.id = $3 AND t.is_published = true
       AND ${publishedAccessSql("t")}
     LIMIT 1`,
    [isAdmin, userId, testId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return mapPublicRow(r);
}

/** Получить тест по ID (включая неопубликованные, для отображения в истории попыток) */
export async function getTestById(testId: string): Promise<{ id: string; title: string; category: string } | null> {
  const { rows } = await db.query(
    `SELECT id, title, category FROM tests WHERE id = $1 LIMIT 1`,
    [testId]
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id, title: rows[0].title, category: rows[0].category };
}

/** Получить тест с вопросами по ID (без проверки is_published, для деталей попытки — вызывать после проверки прав) */
export async function getTestWithQuestionsById(testId: string): Promise<PublicTest | null> {
  const { rows } = await db.query(
    `SELECT id, title, description, category, author, difficulty_level, questions
     FROM tests WHERE id = $1 LIMIT 1`,
    [testId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return mapPublicRow(r);
}

/**
 * Показывать ли текст вопросов и ответы в деталях попытки в профиле.
 * Для restricted-тестов чужие попытки (даже при consent_public_rating) не раскрывают формулировки.
 */
export async function canViewTestQuestionBreakdownInProfile(
  testId: string,
  viewerUserId: string,
  attemptOwnerUserId: string,
  viewerIsAdmin: boolean
): Promise<boolean> {
  if (viewerIsAdmin) return true;
  if (viewerUserId === attemptOwnerUserId) return true;
  const { rows } = await db.query(
    `SELECT COALESCE(visibility, 'public') AS v FROM tests WHERE id = $1`,
    [testId]
  );
  if (rows.length === 0) return false;
  return rows[0].v !== "restricted";
}

/** Получить секретный тест по ID (с ответами), с учётом restricted */
export async function getSecretTest(
  testId: string,
  ctx: TestAccessContext = defaultAccess
): Promise<SecretTest | null> {
  const { userId, isAdmin } = ctx;
  const { rows } = await db.query(
    `SELECT t.id, t.base_points, t.difficulty_level, t.max_attempts, t.answer_key, t.questions
     FROM tests t
     WHERE t.id = $3 AND t.is_published = true
       AND ${publishedAccessSql("t")}
     LIMIT 1`,
    [isAdmin, userId, testId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  const { answerKey } = normalizeTestContentFromDb(r.questions, r.answer_key);
  return {
    id: r.id,
    basePoints: r.base_points,
    difficulty: r.difficulty_level,
    maxAttempts: r.max_attempts,
    answerKey: answerKey as Record<string, any>,
  };
}

/** Получить категории для доступных пользователю тестов */
export async function getCategories(ctx: TestAccessContext = defaultAccess): Promise<string[]> {
  const { userId, isAdmin } = ctx;
  const { rows } = await db.query(
    `SELECT DISTINCT t.category
     FROM tests t
     WHERE t.is_published = true
       AND ${publishedAccessSql("t")}
     ORDER BY t.category`,
    [isAdmin, userId]
  );
  return rows.map((r: any) => r.category);
}

/** Получить тесты по категориям */
export async function getTestsByCategory(ctx: TestAccessContext = defaultAccess): Promise<Record<string, PublicTest[]>> {
  const tests = await getPublicTests(ctx);
  const result: Record<string, PublicTest[]> = {};
  for (const test of tests) {
    if (!result[test.category]) result[test.category] = [];
    result[test.category].push(test);
  }
  return result;
}
