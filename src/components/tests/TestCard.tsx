"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
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
    <article className="group flex flex-col h-full border border-zinc-200 rounded-xl p-4 sm:p-5 hover:shadow-md hover:border-primary-300 transition-all bg-white">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {test.category && (
          <span className="inline-flex items-center rounded-md bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
            {test.category}
          </span>
        )}
        <DifficultyBadge level={test.difficultyLevel} />
      </div>
      <div className="flex items-start gap-2 mb-2">
        <BookOpen className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" aria-hidden />
        <h3 className="font-bold text-base sm:text-lg text-zinc-900 leading-snug">{test.title}</h3>
      </div>
      <p className="text-xs text-zinc-500 mb-2">Автор: {test.author ?? "Денис Колодешников"}</p>
      {test.description && (
        <p className="text-sm text-zinc-600 line-clamp-3 flex-1">{test.description}</p>
      )}
      <Link
        href={`/test?testId=${test.id}`}
        className="inline-flex items-center justify-center gap-2 mt-4 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all"
      >
        Пройти тест
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
