import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Library, ArrowLeft } from "lucide-react";

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { rows } = await db.query(
    "SELECT * FROM knowledge_articles WHERE slug = $1 AND is_published = true",
    [slug]
  );

  if (rows.length === 0) notFound();
  const item = rows[0] as Record<string, unknown>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        База знаний
      </Link>

      <article className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-soft">
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
          className="prose prose-zinc max-w-none prose-headings:font-bold prose-p:text-zinc-700"
          dangerouslySetInnerHTML={{
            __html: (item.content as string) || "",
          }}
        />
      </article>
    </div>
  );
}
