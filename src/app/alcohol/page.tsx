"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Wine } from "lucide-react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import {
  DRINK_TYPES,
  DRINK_TYPE_CONFIG,
  normalizeDrinkType,
  type DrinkType,
} from "@/lib/alcoholDrinkTypes";

type CatalogItem = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: number | null;
  drink_type?: string | null;
  abv?: number;
  country?: string | null;
  region?: string | null;
  producer?: string | null;
  description?: string | null;
};

type Category = { id: number; name: string; slug: string };

export default function AlcoholPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [drinkTypeFilter, setDrinkTypeFilter] = useState<DrinkType | "">("");
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId !== "") params.set("category", String(categoryId));
    if (drinkTypeFilter !== "") params.set("drink_type", drinkTypeFilter);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    fetch(`/api/catalog/alcohol${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId, drinkTypeFilter, q]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/alcohol/categories", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.items)) setCategories(d.items);
      })
      .catch(() => {});
  }, []);

  const applySearch = () => setQ(searchDraft);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Wine className="h-8 w-8 text-primary-600" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Алкоголь
            </h1>
          </div>
          <p className="text-zinc-600 leading-relaxed">
            Справочник напитков: характеристики, гастрономия, материалы для обучения
          </p>
        </div>
        <Link
          href="/alcohol/submit"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-primary-700 transition-colors shrink-0"
        >
          Предложить карточку
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <select
          value={drinkTypeFilter === "" ? "" : drinkTypeFilter}
          onChange={(e) =>
            setDrinkTypeFilter(e.target.value === "" ? "" : normalizeDrinkType(e.target.value))
          }
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white min-w-[200px]"
        >
          <option value="">Все типы напитков</option>
          {DRINK_TYPES.map((dt) => (
            <option key={dt} value={dt}>
              {DRINK_TYPE_CONFIG[dt].label}
            </option>
          ))}
        </select>
        {categories.length > 0 && (
          <select
            value={categoryId === "" ? "" : String(categoryId)}
            onChange={(e) =>
              setCategoryId(e.target.value === "" ? "" : parseInt(e.target.value, 10))
            }
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white min-w-[200px]"
          >
            <option value="">Все разделы каталога</option>
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
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder="Поиск по названию…"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={applySearch}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
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
          icon={Wine}
          title="Ничего не найдено"
          description="Измените фильтр или поиск, либо предложите свою карточку напитка."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const sub = [item.country, item.region].filter(Boolean).map(String).join(", ");
            return (
              <Link
                key={item.id}
                href={`/alcohol/${item.slug}`}
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
                    <Wine className="h-12 w-12 text-zinc-300" />
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-zinc-900 line-clamp-2 group-hover:text-primary-700">
                    {item.name}
                  </h3>
                  {item.drink_type ? (
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {DRINK_TYPE_CONFIG[normalizeDrinkType(item.drink_type)].label}
                    </p>
                  ) : null}
                  {sub ? <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{sub}</p> : null}
                  {item.abv != null && (
                    <p className="text-xs text-zinc-500 mt-0.5">{item.abv}% ABV</p>
                  )}
                  {item.description ? (
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{item.description}</p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
