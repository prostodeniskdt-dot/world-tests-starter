import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeaderboardTable, type LeaderboardRow } from "@/components/LeaderboardTable";

export const revalidate = 10;

export default async function LeaderboardPage() {
  const { data, error } = await supabaseAdmin
    .from("leaderboard")
    .select(
      "rank,user_id,username,first_name,last_name,telegram_username,telegram_id,avatar_url,total_points,tests_completed"
    )
    .order("rank", { ascending: true })
    .limit(50);

  const rows = (data ?? []) as unknown as LeaderboardRow[];

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

      <div className="text-sm text-zinc-600">
        Подсказка: чтобы быстро тестировать, открой сайт в инкогнито — получится
        второй “пользователь” 🙂
      </div>
    </div>
  );
}
