"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Martini } from "lucide-react";
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
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setLoading(true);
    const q =
      filter === "classic" ? "?classic=true" : filter === "author" ? "?classic=false" : "";
    fetch(`/api/catalog/cocktails${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="flex flex-wrap gap-2 mb-6">
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
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? "bg-primary-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/cocktails/${item.slug}`}
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
      )}
    </div>
  );
}
