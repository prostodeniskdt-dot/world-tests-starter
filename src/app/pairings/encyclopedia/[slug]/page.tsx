"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Part = {
  slug: string;
  title: string;
  description: string | null;
  pairingsCount: number;
};

type Entry = {
  id: number;
  externalId: string;
  ingredient1: string;
  ingredient2: string;
  sectionKey: string;
  confidence: string | null;
  practicalApplication: string | null;
};

const SECTION_TABS: { key: string | null; label: string }[] = [
  { key: null, label: "Все" },
  { key: "drinks", label: "Напитки" },
  { key: "food", label: "Еда" },
  { key: "desserts", label: "Десерты" },
  { key: "sauces", label: "Соусы" },
  { key: "universal", label: "Универсальные" },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  "Высокая": "bg-green-100 text-green-800",
  "Средняя": "bg-amber-100 text-amber-800",
  "Гипотеза / практическая": "bg-zinc-100 text-zinc-600",
};

export default function EncyclopediaPartPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [part, setPart] = useState<Part | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const section = searchParams.get("section");

  const load = useCallback(async () => {
    setLoading(true);
    const url = new URL("/api/flavor-encyclopedia", window.location.origin);
    url.searchParams.set("slug", slug);
    if (section) url.searchParams.set("section", section);
    if (query.trim()) url.searchParams.set("q", query.trim());
    url.searchParams.set("limit", "100");

    const data = await fetch(url.toString()).then((r) => r.json());
    if (data.ok) {
      setPart(data.part);
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
  }, [slug, section, query]);

  useEffect(() => {
    load();
  }, [load]);

  const setSection = (key: string | null) => {
    const url = new URL(window.location.href);
    if (key) url.searchParams.set("section", key);
    else url.searchParams.delete("section");
    router.push(url.pathname + url.search);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    router.push(url.pathname + url.search);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link
          href="/pairings/encyclopedia"
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Энциклопедия
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-stone-950">
          {part?.title ?? slug}
        </h1>
        {part?.description && (
          <p className="text-zinc-600 mt-2 leading-relaxed">{part.description}</p>
        )}
        <p className="text-sm text-zinc-500 mt-1">
          {total} сочетаний
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.key ?? "all"}
            onClick={() => setSection(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              (section ?? null) === tab.key
                ? "bg-primary-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по ингредиенту или ID..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
        />
      </form>

      {loading ? (
        <div className="text-zinc-500 py-8 text-center">Загрузка...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          Ничего не найдено
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/pairings/encyclopedia/entry/${entry.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-zinc-900">
                  {entry.ingredient1}
                </span>
                <span className="text-zinc-400">+</span>
                <span className="font-semibold text-zinc-900">
                  {entry.ingredient2}
                </span>
                {entry.confidence && (
                  <span
                    className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      CONFIDENCE_COLORS[entry.confidence] ??
                      "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {entry.confidence}
                  </span>
                )}
              </div>
              {entry.practicalApplication && (
                <p className="text-sm text-zinc-600 line-clamp-2">
                  {entry.practicalApplication}
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-1">{entry.externalId}</p>
            </Link>
          ))}
          {total > entries.length && (
            <p className="text-sm text-zinc-500 text-center py-2">
              Показано {entries.length} из {total}. Уточните поиск для большей выборки.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
