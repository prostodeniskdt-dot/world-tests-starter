"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wine } from "lucide-react";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";

type CatalogItem = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: number | null;
  abv?: number;
};

export default function AlcoholPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/alcohol")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wine className="h-8 w-8 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Алкоголь
          </h1>
        </div>
        <p className="text-zinc-600 leading-relaxed">
          Каталог крепкого алкоголя: виски, джин, ром, текила и другие
        </p>
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
          title="Каталог пока пуст"
          description="Раздел наполняется. Скоро здесь появится каталог алкоголя с описаниями и вкусовыми профилями."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/alcohol/${item.slug}`}
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
                  <Wine className="h-12 w-12 text-zinc-300" />
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-zinc-900 truncate group-hover:text-primary-700">
                  {item.name}
                </h3>
                {item.abv != null && (
                  <p className="text-xs text-zinc-500">{item.abv}% ABV</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
