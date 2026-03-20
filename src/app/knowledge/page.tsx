"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  author_name: string | null;
  created_at: string;
};

export default function KnowledgePage() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Library className="h-8 w-8 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            База знаний
          </h1>
        </div>
        <p className="text-zinc-600 leading-relaxed mb-4">
          Статьи для барменов: профессиональные материалы, юридические вопросы, авторские статьи
        </p>
        <Link
          href="/knowledge/submit"
          className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Предложить статью
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white h-24 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <CatalogEmpty
          icon={Library}
          title="Статей пока нет"
          description="Раздел наполняется. Вы можете предложить свою статью — после модерации она будет опубликована."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/knowledge/${item.slug}`}
              className="block rounded-xl border border-zinc-200 bg-white p-6 hover:shadow-lg hover:border-primary-300 transition-all"
            >
              <h2 className="font-bold text-lg text-zinc-900 mb-2 group-hover:text-primary-700">
                {item.title}
              </h2>
              {item.excerpt && (
                <p className="text-zinc-600 text-sm mb-2 line-clamp-2">{item.excerpt}</p>
              )}
              <div className="text-xs text-zinc-500">
                {item.author_name && <span>{item.author_name}</span>}
                <span>
                  {" "}
                  • {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
