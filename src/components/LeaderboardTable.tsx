import Link from "next/link";
import { Trophy, Medal, Award } from "lucide-react";

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  telegram_username: string | null;
  total_points: number;
  tests_completed: number;
};

function getRankStyle(rank: number) {
  if (rank === 1) {
    return "gradient-gold text-white border-yellow-400";
  } else if (rank === 2) {
    return "gradient-silver text-zinc-900 border-zinc-300";
  } else if (rank === 3) {
    return "gradient-bronze text-white border-amber-600";
  }
  return "bg-white text-zinc-900 border-zinc-200";
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5" aria-label="Первое место" />;
  if (rank === 2) return <Medal className="h-5 w-5" aria-label="Второе место" />;
  if (rank === 3) return <Award className="h-5 w-5" aria-label="Третье место" />;
  return null;
}

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-zinc-200 bg-white shadow-soft">
      <div className="inline-block min-w-full align-middle">
        <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-zinc-700">#</th>
            <th className="px-4 py-3 font-semibold text-zinc-700">Пользователь</th>
            <th className="px-4 py-3 font-semibold text-zinc-700">Telegram</th>
            <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Очки</th>
            <th className="px-4 py-3 font-semibold text-zinc-700 text-right">Тестов</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
            const rankStyle = getRankStyle(r.rank);
            const rankIcon = getRankIcon(r.rank);

            return (
              <tr key={r.user_id} className={`border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors ${rankStyle}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 font-bold">
                    {rankIcon}
                    <span>{r.rank}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/profile?userId=${r.user_id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      r.rank <= 3 
                        ? "bg-white/30 text-white border-2 border-white/50" 
                        : "bg-primary-100 text-primary-700"
                    }`}>
                      {r.first_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-semibold">{fullName || "Без имени"}</div>
                      <div className="text-xs opacity-80">{r.email}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  {r.telegram_username ? (
                    <a
                      href={`https://t.me/${r.telegram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm"
                    >
                      @{r.telegram_username}
                    </a>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 font-bold text-right">{r.total_points.toLocaleString()}</td>
                <td className="px-4 py-4 text-right">{r.tests_completed}</td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-12 text-zinc-500 text-center" colSpan={5}>
                Пока нет результатов. Пройди тест первым 🙂
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>
    </div>
  );
}
