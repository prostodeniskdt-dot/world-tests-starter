"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DifficultyBadge } from "@/components/DifficultyBadge";

export type TestCardItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  author?: string;
  difficultyLevel: 1 | 2 | 3;
};

export function TestCard({ test }: { test: TestCardItem }) {
  return (
    <article className="group flex flex-col h-full rounded-2xl border border-stone-200/70 bg-surface-raised p-6 sm:p-7 transition-colors hover:border-primary-300">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {test.category && (
          <span className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
            {test.category}
          </span>
        )}
        <DifficultyBadge level={test.difficultyLevel} />
      </div>

      <h3 className="font-sans text-base sm:text-[1.0625rem] font-semibold text-stone-950 leading-relaxed tracking-normal group-hover:text-primary-900">
        {test.title}
      </h3>

      <p className="mt-3 text-sm text-stone-500 leading-relaxed">
        Автор: {test.author ?? "Денис Колодешников"}
      </p>

      {test.description && (
        <p className="mt-3 text-sm text-stone-600 leading-relaxed line-clamp-3 flex-1">
          {test.description}
        </p>
      )}

      <Link
        href={`/test?testId=${test.id}`}
        className="inline-flex items-center justify-center gap-2 mt-6 rounded-xl gradient-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition-all min-h-[44px]"
      >
        Пройти тест
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
