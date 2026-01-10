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

import Link from "next/link";

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-zinc-50">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Пользователь</th>
            <th className="px-4 py-3">Telegram</th>
            <th className="px-4 py-3">Очки</th>
            <th className="px-4 py-3">Тестов</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();

            return (
              <tr key={r.user_id} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{r.rank}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/profile?userId=${r.user_id}`}
                    className="hover:underline"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600 text-sm font-medium flex-shrink-0">
                        {r.first_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="font-medium">{fullName || "Без имени"}</div>
                        <div className="text-zinc-600 text-xs">
                          {r.email}
                        </div>
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {r.telegram_username ? (
                    <a
                      href={`https://t.me/${r.telegram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      @{r.telegram_username}
                    </a>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{r.total_points}</td>
                <td className="px-4 py-3">{r.tests_completed}</td>
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-zinc-500" colSpan={5}>
                Пока нет результатов. Пройди тест первым 🙂
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
