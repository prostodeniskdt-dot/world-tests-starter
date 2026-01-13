"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, Award } from "lucide-react";
import { TableSkeleton } from "./LoadingSkeleton";

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

function getRankStyle(rank: number) {
  if (rank === 1) {
    return "bg-gradient-gold text-white border-yellow-400";
  } else if (rank === 2) {
    return "bg-gradient-silver text-zinc-900 border-zinc-300";
  } else if (rank === 3) {
    return "bg-gradient-bronze text-white border-amber-600";
  }
  return "bg-white text-zinc-900 border-zinc-200";
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5" />;
  if (rank === 2) return <Medal className="h-5 w-5" />;
  if (rank === 3) return <Award className="h-5 w-5" />;
  return null;
}

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
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-zinc-900">Мировой рейтинг</h2>
          <span className="text-xs text-success flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
            <span className="h-2 w-2 bg-success rounded-full animate-pulse"></span>
            В реальном времени
          </span>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-zinc-900">Мировой рейтинг</h2>
        <span className="text-xs text-success flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full font-medium">
          <span className="h-2 w-2 bg-success rounded-full animate-pulse"></span>
          В реальном времени
        </span>
      </div>
      <div className="overflow-y-auto max-h-[700px]">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Участник</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider text-right">Очки</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 25).map((r) => {
              const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
              const rankStyle = getRankStyle(r.rank);
              const rankIcon = getRankIcon(r.rank);

              return (
                <tr 
                  key={r.user_id} 
                  className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${rankStyle}`}
                >
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
                        {r.telegram_username && (
                          <a
                            href={`https://t.me/${r.telegram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs opacity-80 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{r.telegram_username}
                          </a>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right font-bold">
                    {r.total_points.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center text-zinc-500 py-12 text-sm">
            Пока нет результатов. Пройди тест первым 🙂
          </div>
        )}
      </div>
    </div>
  );
}
