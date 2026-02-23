"use client";

import { useSearchParams } from "next/navigation";

type ProfileFiltersProps = {
  basePath: string;
  userId?: string;
  testOptions: { id: string; title: string }[];
};

export function ProfileFilters({ basePath, userId, testOptions }: ProfileFiltersProps) {
  const searchParams = useSearchParams();
  const fromDate = searchParams.get("fromDate") ?? "";
  const toDate = searchParams.get("toDate") ?? "";
  const testId = searchParams.get("testId") ?? "";
  const minScore = searchParams.get("minScore") ?? "";
  const maxScore = searchParams.get("maxScore") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "date";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const resetHref = userId ? `${basePath}?userId=${encodeURIComponent(userId)}` : basePath;

  return (
    <form method="get" action={basePath} className="flex flex-col gap-3 mb-4 p-4 bg-zinc-50 rounded-lg">
      {userId && <input type="hidden" name="userId" value={userId} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Дата от</label>
          <input
            type="date"
            name="fromDate"
            defaultValue={fromDate}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Дата до</label>
          <input
            type="date"
            name="toDate"
            defaultValue={toDate}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Тест</label>
          <select
            name="testId"
            defaultValue={testId}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Все</option>
            {testOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title.length > 40 ? t.title.slice(0, 40) + "…" : t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">Результат % (мин — макс)</label>
          <div className="flex gap-1">
            <input
              type="number"
              name="minScore"
              min={0}
              max={100}
              placeholder="0"
              defaultValue={minScore}
              className="w-16 rounded border border-zinc-300 px-2 py-2 text-sm"
            />
            <span className="self-center text-zinc-500">—</span>
            <input
              type="number"
              name="maxScore"
              min={0}
              max={100}
              placeholder="100"
              defaultValue={maxScore}
              className="w-16 rounded border border-zinc-300 px-2 py-2 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-xs font-medium text-zinc-600">Сортировка:</label>
        <select
          name="sortBy"
          defaultValue={sortBy}
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
          onChange={(e) => {
            const form = e.target.form;
            if (form) form.submit();
          }}
        >
          <option value="date">Дата</option>
          <option value="points">Очки</option>
          <option value="percent">Результат %</option>
        </select>
        <select
          name="sortOrder"
          defaultValue={sortOrder}
          className="rounded border border-zinc-300 px-2 py-1 text-sm"
          onChange={(e) => {
            const form = e.target.form;
            if (form) form.submit();
          }}
        >
          <option value="desc">↓ По убыванию</option>
          <option value="asc">↑ По возрастанию</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700"
        >
          Применить
        </button>
        <a
          href={resetHref}
          className="text-sm text-zinc-600 hover:underline"
        >
          Сбросить
        </a>
      </div>
    </form>
  );
}
