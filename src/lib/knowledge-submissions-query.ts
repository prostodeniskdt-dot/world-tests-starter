import "server-only";
import { db } from "@/lib/db";

const SUBMISSIONS_FULL = `
  SELECT s.id, s.title, s.slug, s.excerpt, s.content, s.status, s.created_at, s.user_id,
         s.category_id, s.cover_image_url, s.practice_test_id,
         t.title AS practice_test_title,
         u.first_name, u.last_name, u.email,
         c.name AS category_name
  FROM article_submissions s
  LEFT JOIN users u ON u.id = s.user_id
  LEFT JOIN knowledge_categories c ON c.id = s.category_id
  LEFT JOIN tests t ON t.id = s.practice_test_id
  ORDER BY s.created_at DESC
`;

const SUBMISSIONS_LEGACY = `
  SELECT s.id, s.title, s.slug, s.excerpt, s.content, s.status, s.created_at, s.user_id,
         u.first_name, u.last_name, u.email
  FROM article_submissions s
  LEFT JOIN users u ON u.id = s.user_id
  ORDER BY s.created_at DESC
`;

function isUndefinedColumnError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    String((err as { code: unknown }).code) === "42703"
  );
}

function isUndefinedTableError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    String((err as { code: unknown }).code) === "42P01"
  );
}

/** Категории для селекта модерации; пустой массив, если таблицы ещё нет (миграции не прогнаны). */
export async function queryKnowledgeCategoriesForSelect(): Promise<{ id: number; name: string }[]> {
  try {
    const { rows } = await db.query(
      `SELECT id, name FROM knowledge_categories ORDER BY sort_order ASC, id ASC`
    );
    return rows as { id: number; name: string }[];
  } catch (err) {
    if (isUndefinedTableError(err) || isUndefinedColumnError(err)) {
      console.error("knowledge_categories недоступна (нужны миграции БД):", err);
      return [];
    }
    throw err;
  }
}

export type AdminSubmissionRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: string;
  created_at: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  category_id: number | null;
  cover_image_url: string | null;
  category_name: string | null;
  practice_test_id: string | null;
  practice_test_title: string | null;
};

/** Заявки для админки: полный запрос или без колонок миграции 20260321, если их ещё нет в БД. */
export async function queryArticleSubmissionsForAdmin(): Promise<AdminSubmissionRow[]> {
  try {
    const { rows } = await db.query(SUBMISSIONS_FULL);
    return rows as AdminSubmissionRow[];
  } catch (err) {
    if (!isUndefinedColumnError(err)) throw err;
    const { rows } = await db.query(SUBMISSIONS_LEGACY);
    return (
      rows as Omit<
        AdminSubmissionRow,
        | "category_id"
        | "cover_image_url"
        | "category_name"
        | "practice_test_id"
        | "practice_test_title"
      >[]
    ).map((r) => ({
      ...r,
      category_id: null,
      cover_image_url: null,
      category_name: null,
      practice_test_id: null,
      practice_test_title: null,
    }));
  }
}
