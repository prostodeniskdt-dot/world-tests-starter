"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Martini, Search, Loader2 } from "lucide-react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";

type CatalogItem = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: number | null;
  is_classic?: boolean;
  description?: string | null;
};

type Filter = "all" | "classic" | "author";

export default function CocktailsPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [total, setTotal] = useState(0);
  const limit = 50;
  const [offset, setOffset] = useState(0);

  const fetchPage = useCallback(
    (nextOffset: number, mode: "replace" | "append") => {
      const params = new URLSearchParams();
      if (filter === "classic") params.set("classic", "true");
      else if (filter === "author") params.set("classic", "false");
      if (q.trim()) params.set("q", q.trim());
      params.set("limit", String(limit));
      params.set("offset", String(nextOffset));
      const qs = params.toString();
      return fetch(`/api/catalog/cocktails?${qs}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data?.ok) return;
          const newItems: CatalogItem[] = data.items || [];
          setTotal(Number(data.total) || 0);
          setOffset(Number(data.offset) || nextOffset);
          setItems((prev) => (mode === "append" ? [...prev, ...newItems] : newItems));
        });
    },
    [filter, q]
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchPage(0, "replace")
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchPage]);

  useEffect(() => {
    load();
  }, [load]);

  const applySearch = () => setQ(searchDraft);

  const canLoadMore = items.length < total;
  const loadMore = () => {
    if (loadingMore || !canLoadMore) return;
    setLoadingMore(true);
    fetchPage(offset + limit, "append")
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Martini className="h-8 w-8 text-primary-600" aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Коктейли
            </h1>
          </div>
          <p className="text-zinc-600 leading-relaxed">
            Классические и авторские рецепты
          </p>
        </div>
        <Link
          href="/cocktails/submit"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-primary-700 transition-colors shrink-0"
        >
          Предложить коктейль
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all" as const, label: "Все" },
              { key: "classic" as const, label: "Классика" },
              { key: "author" as const, label: "Авторские" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:border-primary-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Найти коктейль…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={applySearch}
            className="rounded-lg bg-primary-600 text-white px-3 py-2 hover:bg-primary-700 transition-colors"
          >
            <Search className="h-4 w-4" />
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
          icon={Martini}
          title="Пока пусто"
          description="В этом фильтре нет коктейлей. Загляните позже или предложите свой рецепт."
        />
      ) : (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/cocktails/id/${item.id}`}
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
                    <Martini className="h-12 w-12 text-zinc-300" />
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1 min-h-[4.5rem]">
                  <h3 className="font-semibold text-zinc-900 line-clamp-2 group-hover:text-primary-700">
                    {item.name}
                  </h3>
                  <span
                    className={`text-xs mt-1 ${item.is_classic ? "text-primary-600" : "text-zinc-500"}`}
                  >
                    {item.is_classic ? "Классика" : "Авторский"}
                  </span>
                  {item.description ? (
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1 flex-1">{item.description}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>

          {canLoadMore && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                Показать ещё ({items.length} из {total})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
