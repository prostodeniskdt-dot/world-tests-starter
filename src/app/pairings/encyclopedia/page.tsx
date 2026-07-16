"use client";

import Link from "next/link";
import { ArrowLeft, Library, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type Part = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  pairingsCount: number;
};

export default function EncyclopediaIndexPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flavor-encyclopedia")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setParts(data.parts ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Link
          href="/pairings"
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Сочетания
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Library className="h-8 w-8 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-stone-950">
            Энциклопедия сочетаний
          </h1>
        </div>
        <p className="text-zinc-600 leading-relaxed max-w-3xl">
          Полная база сочетаний по категориям продуктов: научные объяснения,
          молекулы, обработка, критические точки и практическое применение.
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-500 py-12 text-center">Загрузка...</div>
      ) : parts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          Энциклопедия пока не загружена. Запустите импорт данных.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parts.map((part) => (
            <Link
              key={part.slug}
              href={`/pairings/encyclopedia/${part.slug}`}
              className="group flex flex-col rounded-xl border-2 border-zinc-200 bg-white p-5 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-bold text-lg text-zinc-900 group-hover:text-primary-700">
                  {part.title}
                </h2>
                <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-primary-500 shrink-0 mt-0.5" />
              </div>
              {part.description && (
                <p className="text-sm text-zinc-600 flex-1 line-clamp-3">
                  {part.description}
                </p>
              )}
              <p className="mt-3 text-xs font-medium text-primary-600">
                {part.pairingsCount} сочетаний
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
