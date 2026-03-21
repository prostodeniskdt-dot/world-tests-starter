"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";

type Category = { id: number; name: string; slug: string };

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  author_name: string | null;
  created_at: string;
  cover_image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
};

export default function KnowledgePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/knowledge/categories", { credentials: "same-origin" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.ok) setCategories(data.items || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : "";
    fetch(`/api/knowledge${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory]);

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
          Статьи для барменов: профессиональные материалы, юридические вопросы, авторские материалы
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <Link
            href="/knowledge/submit"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Предложить статью
          </Link>
          <Link
            href="/knowledge/my-submissions"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Мои заявки
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === ""
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:border-primary-300"
              }`}
            >
              Все
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(String(c.id))}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === String(c.id)
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:border-primary-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white h-28 animate-pulse" />
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
              className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 hover:shadow-lg hover:border-primary-300 transition-all"
            >
              {item.cover_image_url ? (
                <div className="hidden sm:block flex-shrink-0 w-36 h-24 rounded-lg overflow-hidden border border-zinc-100 bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.cover_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                {item.category_name ? (
                  <span className="text-xs font-medium text-primary-600 mb-1 inline-block">
                    {item.category_name}
                  </span>
                ) : null}
                <h2 className="font-bold text-lg text-zinc-900 mb-2">{item.title}</h2>
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
