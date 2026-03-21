"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { PRICE_SEGMENT_LABELS } from "@/lib/techniqueLabels";

type CatalogItem = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: number | null;
  subcategory_text?: string | null;
  producer?: string | null;
  price_segment?: string | null;
  description?: string | null;
  tags?: string[] | null;
};

type Category = { id: number; name: string; slug: string };

export default function GlasswarePage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId !== "") params.set("category", String(categoryId));
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    fetch(`/api/catalog/glassware${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId, q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/glassware/categories", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) setCategories(d.items);
      })
      .catch(() => {});
  }, []);

  const catName = (id: number | null | undefined) =>
    id == null ? null : categories.find((c) => c.id === id)?.name ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UtensilsCrossed className="h-8 w-8 text-primary-600" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Посуда
            </h1>
          </div>
          <p className="text-zinc-600 leading-relaxed">
            Бокалы, стаканы, барный инвентарь и кухонная посуда
          </p>
        </div>
        <Link
          href="/glassware/submit"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-primary-700 shrink-0"
        >
          Предложить карточку
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        {categories.length > 0 && (
          <select
            value={categoryId === "" ? "" : String(categoryId)}
            onChange={(e) =>
              setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
            }
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white min-w-[220px]"
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), setQ(searchDraft))}
            placeholder="Поиск…"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={() => setQ(searchDraft)}
            className="rounded-lg bg-zinc-200 text-zinc-800 px-4 py-2 text-sm hover:bg-zinc-300"
          >
            Найти
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white h-48 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <CatalogEmpty
          icon={UtensilsCrossed}
          title="Каталог пока пуст"
          description="Раздел наполняется. Предложите карточку посуды или зайдите позже."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/glassware/${item.slug}`}
              className="group rounded-xl border border-zinc-200 bg-white overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all"
            >
              <div className="aspect-square bg-zinc-100 flex items-center justify-center">
                {item.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="h-12 w-12 text-zinc-300" />
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-zinc-900 truncate group-hover:text-primary-700">
                  {item.name}
                </h3>
                {item.subcategory_text || catName(item.category_id) ? (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {[item.subcategory_text, catName(item.category_id)].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {item.price_segment && PRICE_SEGMENT_LABELS[item.price_segment] ? (
                  <span className="inline-block mt-1 text-xs text-zinc-600">
                    {PRICE_SEGMENT_LABELS[item.price_segment]}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
