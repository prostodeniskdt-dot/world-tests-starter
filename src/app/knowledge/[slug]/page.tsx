import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { ArrowLeft, ClipboardCheck, UserCircle } from "lucide-react";
import { sanitizeArticleHtml } from "@/lib/sanitizeArticleHtml";

/** Не кэшировать как статику — slug и содержимое из БД. */
export const dynamic = "force-dynamic";

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();

  const { rows } = await db.query(
    `SELECT a.*, c.name AS category_name
     FROM knowledge_articles a
     LEFT JOIN knowledge_categories c ON c.id = a.category_id
     WHERE a.slug = $1 AND a.is_published = true`,
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Record<string, unknown>;
  const safeHtml = sanitizeArticleHtml(String(item.content || ""));
  const cover = item.cover_image_url ? String(item.cover_image_url) : null;
  const categoryName = item.category_name ? String(item.category_name) : null;

  let practiceTestId: string | null = null;
  let practiceTestTitle: string | null = null;
  const rawPracticeId = item.practice_test_id != null ? String(item.practice_test_id).trim() : "";
  if (rawPracticeId) {
    try {
      const tr = await db.query(
        `SELECT id, title FROM tests WHERE id = $1 AND is_published = true LIMIT 1`,
        [rawPracticeId]
      );
      const trow = tr.rows[0] as { id: string; title: string } | undefined;
      if (trow) {
        practiceTestId = String(trow.id);
        practiceTestTitle = String(trow.title);
      }
    } catch {
      /* колонка practice_test_id или таблица tests — кнопку теста просто не показываем */
    }
  }

  const authorId = item.author_id != null ? String(item.author_id) : null;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const viewer = token ? verifyToken(token) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        База знаний
      </Link>

      <article className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-soft">
        {cover ? (
          <div className="w-full aspect-[21/9] max-h-72 bg-zinc-100 border-b border-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
        <div className="p-6 sm:p-8">
          {categoryName ? (
            <p className="text-sm font-medium text-primary-600 mb-2">{categoryName}</p>
          ) : null}
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-4">
            {String(item.title)}
          </h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1 text-sm text-zinc-500 mb-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-zinc-500">Автор:</span>
              {item.author_name ? (
                <span className="font-medium text-zinc-800">{String(item.author_name)}</span>
              ) : (
                <span className="text-zinc-500">Не указан</span>
              )}
              {authorId ? (
                viewer ? (
                  <Link
                    href={`/profile?userId=${encodeURIComponent(authorId)}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-100 min-h-[36px]"
                  >
                    <UserCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                    Профиль автора
                  </Link>
                ) : (
                  <Link
                    href={`/profile?userId=${encodeURIComponent(authorId)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    <UserCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                    Войдите, чтобы открыть профиль автора
                  </Link>
                )
              ) : null}
            </div>
            <span className="text-zinc-500">
              {new Date(item.created_at as string).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div
            className="knowledge-prose prose prose-zinc max-w-none prose-headings:font-bold prose-p:text-zinc-700 prose-img:rounded-lg overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {practiceTestId && practiceTestTitle ? (
            <div className="mt-8 pt-6 border-t border-zinc-200">
              <p className="text-sm text-zinc-600 mb-3">
                После прочтения можете пройти тест и закрепить материал.
              </p>
              <Link
                href={`/test?testId=${encodeURIComponent(practiceTestId)}`}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity min-h-[44px]"
              >
                <ClipboardCheck className="h-5 w-5 flex-shrink-0" aria-hidden />
                Перейти к тесту: {practiceTestTitle}
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}