import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeaderboardTable, type LeaderboardRow } from "@/components/LeaderboardTable";
import { LeaderboardPagination } from "@/components/LeaderboardPagination";
import { Trophy } from "lucide-react";
import { TableSkeleton } from "@/components/LoadingSkeleton";

export const revalidate = 10;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  let page = 1;
  let rows: LeaderboardRow[] = [];
  let totalPages = 1;
  let error: Error | null = null;

  try {
    page = parseInt(searchParams?.page || "1", 10);
    const limit = 50;
    const offset = (page - 1) * limit;

    const { data, error: dbError, count } = await supabaseAdmin
      .from("leaderboard")
      .select("*", { count: "exact" })
      .order("rank", { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      error = new Error(dbError.message);
    }

    rows = (data ?? []) as unknown as LeaderboardRow[];
    totalPages = count ? Math.ceil(count / limit) : 1;
  } catch (e) {
    error = e instanceof Error ? e : new Error("Неизвестная ошибка при загрузке рейтинга");
    rows = [];
    totalPages = 1;
  }

  const hintText = 'Подсказка: чтобы быстро тестировать, открой сайт в инкогнито — получится второй "пользователь" 🙂';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-zinc-900">Мировой рейтинг</h1>
        </div>
        <p className="mt-2 text-zinc-600">
          Сортировка по сумме очков (чем больше — тем выше).
        </p>
        {error ? (
          <p className="mt-3 text-sm text-error bg-red-50 border border-red-200 rounded-lg p-3">
            Ошибка чтения рейтинга: {error.message}
          </p>
        ) : null}
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <LeaderboardTable rows={rows} />
      </Suspense>

      <Suspense fallback={<div className="text-center py-4 text-zinc-600">Загрузка пагинации...</div>}>
        <LeaderboardPagination
          currentPage={page}
          totalPages={totalPages}
        />
      </Suspense>

      <div className="text-sm text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
        {hintText}
      </div>
    </div>
  );
}
