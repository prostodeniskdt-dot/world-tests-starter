"use client";

import { useEffect, useState, useMemo } from "react";
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

const RANK_1_BG = "linear-gradient(135deg, #fef08a 0%, #fde047 50%, #facc15 100%)";
const RANK_2_BG = "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 50%, #9ca3af 100%)";
const RANK_3_BG = "linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%)";

function getRankRowClass(rank: number): string {
  if (rank === 1) return "rank-1-row";
  if (rank === 2) return "rank-2-row";
  if (rank === 3) return "rank-3-row";
  return "";
}

function getRankStyle(rank: number): { className: string; style?: React.CSSProperties } {
  if (rank === 1) return { className: "text-amber-900 border-l-4 border-amber-600", style: { background: RANK_1_BG } };
  if (rank === 2) return { className: "text-zinc-900 border-l-4 border-zinc-500", style: { background: RANK_2_BG } };
  if (rank === 3) return { className: "text-amber-900 border-l-4 border-orange-600", style: { background: RANK_3_BG } };
  return { className: "bg-white text-zinc-900 border-zinc-200" };
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5" aria-label="Первое место" />;
  if (rank === 2) return <Medal className="h-5 w-5" aria-label="Второе место" />;
  if (rank === 3) return <Award className="h-5 w-5" aria-label="Третье место" />;
  return null;
}

export function LiveLeaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(25);

  const fetchLeaderboard = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/leaderboard");
      const result = await response.json();
      if (result.ok) {
        setRows(result.rows || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки рейтинга:", error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(() => {
      // Обновляем только если страница видима
      if (!document.hidden) {
        fetchLeaderboard();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayedRows = useMemo(() => {
    return rows.slice(0, displayLimit);
  }, [rows, displayLimit]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900">Мировой рейтинг</h2>
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
    <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900">Мировой рейтинг</h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={fetchLeaderboard}
            disabled={isRefreshing}
            className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors px-2 py-1 rounded hover:bg-primary-50"
            aria-label="Обновить рейтинг"
          >
            {isRefreshing ? "Обновление..." : "Обновить"}
          </button>
          <span className={`text-xs flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${
            isRefreshing ? 'bg-primary-50 text-primary-600' : 'bg-green-50 text-success'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              isRefreshing ? 'bg-primary-600 animate-spin' : 'bg-success animate-pulse'
            }`}></span>
            {isRefreshing ? 'Обновление...' : 'В реальном времени'}
          </span>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 -mx-4 sm:mx-0">
        {/* Мобильный вид - карточки */}
        <div className="block sm:hidden space-y-3 px-4">
          {displayedRows.map((r) => {
            const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
            const rankStyle = getRankStyle(r.rank);
            const rankIcon = getRankIcon(r.rank);
            return (
              <div 
                key={r.user_id} 
                className={`rounded-lg border-2 p-4 ${getRankRowClass(r.rank)} ${rankStyle.className}`}
                style={rankStyle.style}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold">
                    {rankIcon}
                    <span>#{r.rank}</span>
                  </div>
                  <div className="text-lg font-bold">{r.total_points.toLocaleString()}</div>
                </div>
                <Link
                  href={`/profile?userId=${r.user_id}`}
                  className="flex items-center gap-3"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    r.rank <= 3 
                      ? "bg-white/80 text-zinc-800 border border-zinc-300/80" 
                      : "bg-primary-100 text-primary-700"
                  }`}>
                    {r.first_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{fullName || "Без имени"}</div>
                    {r.telegram_username && (
                      <a
                        href={`https://t.me/${r.telegram_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs opacity-80 hover:underline truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{r.telegram_username}
                      </a>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Десктопный вид - таблица */}
        <div className="hidden sm:block inline-block min-w-full align-middle">
          <table className="w-full text-left">
          <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Участник</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider text-right">Очки</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((r) => {
              const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
              const rankStyle = getRankStyle(r.rank);
              const rankIcon = getRankIcon(r.rank);
              const isTop3 = r.rank <= 3;
              return (
                <tr 
                  key={r.user_id} 
                  className={`border-b border-zinc-100 transition-colors ${getRankRowClass(r.rank)} ${rankStyle.className} ${!isTop3 ? "hover:bg-zinc-50" : ""}`}
                  style={rankStyle.style}
                >
                  <td className="px-4 py-4" style={rankStyle.style}>
                    <div className="flex items-center gap-2 font-bold">
                      {rankIcon}
                      <span>{r.rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4" style={rankStyle.style}>
                    <Link
                      href={`/profile?userId=${r.user_id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        r.rank <= 3 
                          ? "bg-white/80 text-zinc-800 border border-zinc-300/80" 
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
                  <td className="px-4 py-4 text-right font-bold" style={rankStyle.style}>
                    {r.total_points.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="text-center text-zinc-500 py-12 text-sm">
            Пока нет результатов. Пройди тест первым 🙂
          </div>
        )}
        {rows.length > displayLimit && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setDisplayLimit(prev => prev + 25)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Показать еще ({rows.length - displayLimit} участников)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
