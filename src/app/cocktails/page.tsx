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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/cocktails/id/${item.id}`}
                className="group rounded-2xl border border-zinc-200/90 bg-white overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:border-primary-400/40 hover:-translate-y-1 transition-all duration-300 ring-1 ring-transparent hover:ring-primary-500/10"
              >
                <div className="relative aspect-square bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <Martini className="h-12 w-12 text-zinc-300" />
                  )}
                  <span
                    className={`absolute left-2 top-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shadow-sm ${
                      item.is_classic
                        ? "bg-primary-600 text-white"
                        : "bg-white/95 text-zinc-700 ring-1 ring-zinc-200"
                    }`}
                  >
                    {item.is_classic ? "Классика" : "Автор"}
                  </span>
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-1 min-h-[5rem] border-t border-zinc-100/80">
                  <h3 className="font-semibold text-zinc-900 line-clamp-2 text-sm sm:text-base leading-snug group-hover:text-primary-700 transition-colors">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-2 mt-2 flex-1 leading-relaxed">
                      {item.description}
                    </p>
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
