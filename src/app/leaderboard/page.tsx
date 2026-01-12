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
      <div className="rounded-md border bg-white p-4">
        <h1 className="text-2xl font-bold">Мировой рейтинг</h1>
        <p className="mt-1 text-zinc-600">
          Сортировка по сумме очков (чем больше — тем выше).
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-700">
            Ошибка чтения рейтинга: {error.message}
          </p>
        ) : null}
      </div>

      <LeaderboardTable rows={rows} />

      <LeaderboardPagination
        currentPage={page}
        totalPages={totalPages}
      />

      <div className="text-sm text-zinc-600">
        {hintText}
      </div>
    </div>
  );
}
