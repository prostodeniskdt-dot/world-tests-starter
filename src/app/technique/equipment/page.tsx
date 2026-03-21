"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Wrench, ArrowLeft } from "lucide-react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { PRICE_SEGMENT_LABELS } from "@/lib/techniqueLabels";

type CatalogItem = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: number | null;
  producer?: string | null;
  price_segment?: string | null;
  description?: string | null;
  tags?: string[] | null;
};

type Category = { id: number; name: string; slug: string };

export default function TechniqueEquipmentListPage() {
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
    fetch(`/api/catalog/technique${qs ? `?${qs}` : ""}`)
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
    fetch("/api/technique/equipment/categories", { credentials: "same-origin" })
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
      <Link
        href="/technique"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Техника и навыки
      </Link>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="h-8 w-8 text-primary-600" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Оборудование
            </h1>
          </div>
          <p className="text-zinc-600 leading-relaxed">
            Техника для баров и кухонь: характеристики и опыт использования
          </p>
        </div>
        <Link
          href="/technique/equipment/submit"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-primary-700 shrink-0"
        >
          Предложить модель
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
        <div className="flex flex-1 gap-2 min-w-[200px] max-w-md">
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQ(searchDraft)}
            placeholder="Поиск…"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setQ(searchDraft)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
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
          icon={Wrench}
          title="Пока пусто"
          description="Заявки на карточки проходят модерацию. Вы можете предложить свою модель."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/technique/equipment/${item.slug}`}
              className="group rounded-xl border border-zinc-200 bg-white overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all flex flex-col"
            >
              <div className="aspect-square bg-zinc-100 flex items-center justify-center shrink-0">
                {item.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Wrench className="h-12 w-12 text-zinc-300" />
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="font-semibold text-zinc-900 line-clamp-2 group-hover:text-primary-700">
                  {item.name}
                </h3>
                {item.producer ? (
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.producer}</p>
                ) : null}
                {item.price_segment ? (
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {PRICE_SEGMENT_LABELS[item.price_segment] ?? item.price_segment}
                  </p>
                ) : null}
                {catName(item.category_id) ? (
                  <p className="text-[11px] text-primary-700 mt-1">{catName(item.category_id)}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
