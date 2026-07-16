"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Beaker, AlertTriangle, ChefHat, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

type Entry = {
  id: number;
  externalId: string;
  partSlug: string;
  partTitle: string;
  mainSection: string;
  sectionKey: string;
  baseIngredient: string | null;
  ingredient1: string;
  ingredient2: string;
  original1: string | null;
  original2: string | null;
  group1: string | null;
  group2: string | null;
  aromaProfile1: string | null;
  aromaProfile2: string | null;
  compounds1: string | null;
  compounds2: string | null;
  mechanismType: string | null;
  explanation: string | null;
  processing: string | null;
  criticalPoints: string | null;
  practicalApplication: string | null;
  confidence: string | null;
  sources: string | null;
  pages: string | null;
};

function DetailBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-primary-600" aria-hidden="true" />
        <h2 className="font-bold text-zinc-900">{title}</h2>
      </div>
      <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </section>
  );
}

export default function EncyclopediaEntryPage() {
  const params = useParams();
  const id = params.id as string;
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/flavor-encyclopedia/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEntry(data.entry);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-zinc-500">
        Загрузка...
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-zinc-500 mb-4">Запись не найдена</p>
        <Link href="/pairings/encyclopedia" className="text-primary-600 hover:underline">
          ← К энциклопедии
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/pairings/encyclopedia/${entry.partSlug}`}
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {entry.partTitle}
      </Link>

      <header className="mb-8">
        <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-2">
          {entry.mainSection} · {entry.externalId}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-stone-950">
          {entry.ingredient1}{" "}
          <span className="text-zinc-400 font-normal">+</span>{" "}
          {entry.ingredient2}
        </h1>
        {entry.confidence && (
          <span className="inline-block mt-3 text-sm px-3 py-1 rounded-full bg-primary-50 text-primary-800 font-medium">
            {entry.confidence}
          </span>
        )}
      </header>

      <div className="grid gap-4 mb-6">
        {(entry.group1 || entry.group2 || entry.aromaProfile1) && (
          <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
            <h2 className="font-bold text-zinc-900 mb-3">Профили ингредиентов</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-zinc-900">{entry.ingredient1}</dt>
                {entry.group1 && (
                  <dd className="text-zinc-500">Группа: {entry.group1}</dd>
                )}
                {entry.aromaProfile1 && (
                  <dd className="text-zinc-700 mt-0.5">{entry.aromaProfile1}</dd>
                )}
                {entry.compounds1 && (
                  <dd className="text-zinc-600 mt-1 text-xs">
                    Соединения: {entry.compounds1}
                  </dd>
                )}
              </div>
              <div className="border-t border-zinc-200 pt-3">
                <dt className="font-medium text-zinc-900">{entry.ingredient2}</dt>
                {entry.group2 && (
                  <dd className="text-zinc-500">Группа: {entry.group2}</dd>
                )}
                {entry.aromaProfile2 && (
                  <dd className="text-zinc-700 mt-0.5">{entry.aromaProfile2}</dd>
                )}
                {entry.compounds2 && (
                  <dd className="text-zinc-600 mt-1 text-xs">
                    Соединения: {entry.compounds2}
                  </dd>
                )}
              </div>
            </dl>
          </section>
        )}

        {entry.mechanismType && (
          <section className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <p className="text-sm font-medium text-primary-900">
              Механизм: {entry.mechanismType}
            </p>
          </section>
        )}
      </div>

      <div className="space-y-4">
        <DetailBlock icon={Beaker} title="Научное объяснение">
          {entry.explanation}
        </DetailBlock>
        <DetailBlock icon={ChefHat} title="Обработка">
          {entry.processing}
        </DetailBlock>
        <DetailBlock icon={AlertTriangle} title="Критические точки">
          {entry.criticalPoints}
        </DetailBlock>
        <DetailBlock icon={BookOpen} title="Практическое применение">
          {entry.practicalApplication}
        </DetailBlock>
      </div>

      {(entry.sources || entry.pages) && (
        <footer className="mt-8 pt-6 border-t border-zinc-200 text-xs text-zinc-500">
          {entry.sources && <p>Источники: {entry.sources}</p>}
          {entry.pages && <p className="mt-1">Страницы: {entry.pages}</p>}
        </footer>
      )}
    </div>
  );
}
