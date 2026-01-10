"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LeaderboardRow = {
  rank: number;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  telegram_username: string | null;
  total_points: number;
  tests_completed: number;
};

export function LiveLeaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const result = await response.json();
      if (result.ok) {
        setRows(result.rows || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки рейтинга:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Обновляем рейтинг каждые 10 секунд
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-md border bg-white p-4">
        <h2 className="text-xl font-bold mb-4">Мировой рейтинг</h2>
        <div className="text-center text-zinc-500 py-8">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Мировой рейтинг</h2>
        <span className="text-xs text-green-600 flex items-center gap-1">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
          В реальном времени
        </span>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white border-b">
            <tr>
              <th className="px-2 py-2 text-xs font-medium text-zinc-600">#</th>
              <th className="px-2 py-2 text-xs font-medium text-zinc-600">Участник</th>
              <th className="px-2 py-2 text-xs font-medium text-zinc-600">Очки</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((r) => {
              const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();

              return (
                <tr key={r.user_id} className="border-b hover:bg-zinc-50 transition-colors">
                  <td className="px-2 py-2 font-medium text-xs">{r.rank}</td>
                  <td className="px-2 py-2">
                    <Link
                      href={`/profile?userId=${r.user_id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <div className="h-6 w-6 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600 text-xs font-medium flex-shrink-0">
                        {r.first_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="text-xs font-medium">{fullName || "Без имени"}</div>
                        {r.telegram_username && (
                          <a
                            href={`https://t.me/${r.telegram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{r.telegram_username}
                          </a>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-2 py-2 font-medium text-xs">{r.total_points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center text-zinc-500 py-8 text-sm">
            Пока нет результатов. Пройди тест первым 🙂
          </div>
        )}
      </div>
    </div>
  );
}
