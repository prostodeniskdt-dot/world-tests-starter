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
      <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold">🏆</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Мировой рейтинг
          </h2>
        </div>
        <div className="text-center text-amber-700 py-8">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold">🏆</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Мировой рейтинг
          </h2>
        </div>
        <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
          В реальном времени
        </span>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-200">
            <tr>
              <th className="px-3 py-3 text-sm font-bold text-amber-900">#</th>
              <th className="px-3 py-3 text-sm font-bold text-amber-900">Участник</th>
              <th className="px-3 py-3 text-sm font-bold text-amber-900">Очки</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((r) => {
              const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
              const isTopThree = r.rank <= 3;
              const medalColors = [
                'from-yellow-400 to-yellow-600', // 1 место - золото
                'from-gray-300 to-gray-400',     // 2 место - серебро
                'from-amber-600 to-amber-800',   // 3 место - бронза
              ];
              const medalEmojis = ['🥇', '🥈', '🥉'];

              return (
                <tr 
                  key={r.user_id} 
                  className={`
                    border-b transition-all hover:shadow-md
                    ${isTopThree ? `bg-gradient-to-r ${medalColors[r.rank - 1]} text-white font-semibold` : 'hover:bg-amber-50'}
                  `}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {isTopThree && <span className="text-xl">{medalEmojis[r.rank - 1]}</span>}
                      <span className={isTopThree ? 'text-white font-bold' : 'font-semibold'}>{r.rank}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/profile?userId=${r.user_id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isTopThree 
                          ? 'bg-white/30 text-white border-2 border-white/50' 
                          : 'bg-gradient-to-br from-amber-200 to-orange-200 text-amber-900'
                      }`}>
                        {r.first_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className={isTopThree ? 'text-white font-semibold' : 'font-medium'}>{fullName || "Без имени"}</div>
                        {r.telegram_username && (
                          <a
                            href={`https://t.me/${r.telegram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs hover:underline ${isTopThree ? 'text-white/90' : 'text-blue-600'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{r.telegram_username}
                          </a>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className={`px-3 py-3 font-bold ${isTopThree ? 'text-white' : 'text-amber-700'}`}>
                    {r.total_points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center text-amber-700 py-8 text-sm">
            Пока нет результатов. Пройди тест первым 🙂
          </div>
        )}
      </div>
    </div>
  );
}
