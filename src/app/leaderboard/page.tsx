import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeaderboardTable, type LeaderboardRow } from "@/components/LeaderboardTable";
import { LeaderboardPagination } from "@/components/LeaderboardPagination";

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
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold">🏆</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Мировой рейтинг
          </h1>
        </div>
        <p className="mt-1 text-amber-800 ml-[52px]">
          Сортировка по сумме очков (чем больше — тем выше).
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-700">
            Ошибка чтения рейтинга: {error.message}
          </p>
        ) : null}
      </div>

      <LeaderboardTable rows={rows} />

      <Suspense fallback={<div className="text-center py-4 text-zinc-600">Загрузка пагинации...</div>}>
        <LeaderboardPagination
          currentPage={page}
          totalPages={totalPages}
        />
      </Suspense>

      <div className="text-sm text-zinc-600">
        {hintText}
      </div>
    </div>
  );
}
