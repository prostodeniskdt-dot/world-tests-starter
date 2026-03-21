import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { sanitizeArticleHtml } from "@/lib/sanitizeArticleHtml";

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            {item.author_name ? (
              <span className="font-medium text-zinc-700">{String(item.author_name)}</span>
            ) : null}
            <span>
              {new Date(item.created_at as string).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div
            className="prose prose-zinc max-w-none prose-headings:font-bold prose-p:text-zinc-700 prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </div>
      </article>
    </div>
  );
}
