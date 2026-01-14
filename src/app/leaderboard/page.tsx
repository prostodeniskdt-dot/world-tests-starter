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
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from("leaderboard")
    .select("*", { count: "exact" })
    .order("rank", { ascending: true })
    .range(offset, offset + limit - 1);

  const rows = (data ?? []) as unknown as LeaderboardRow[];
  const totalPages = count ? Math.ceil(count / limit) : 1;
  const hintText = 'Подсказка: чтобы быстро тестировать, открой сайт в инкогнито — получится второй "пользователь" 🙂';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-soft p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-white" />
          <h1 className="text-3xl font-bold text-zinc-100">Мировой рейтинг</h1>
        </div>
        <p className="mt-2 text-zinc-400">
          Сортировка по сумме очков (чем больше — тем выше).
        </p>
        {error ? (
          <p className="mt-3 text-sm text-error bg-zinc-800 border border-zinc-700 rounded-lg p-3">
            Ошибка чтения рейтинга: {error.message}
          </p>
        ) : null}
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <LeaderboardTable rows={rows} />
      </Suspense>

      <Suspense fallback={<div className="text-center py-4 text-zinc-400">Загрузка пагинации...</div>}>
        <LeaderboardPagination
          currentPage={page}
          totalPages={totalPages}
        />
      </Suspense>

      <div className="text-sm text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        {hintText}
      </div>
    </div>
  );
}
