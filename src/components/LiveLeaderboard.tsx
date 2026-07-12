"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Trophy, Medal, Award } from "lucide-react";
import { TableSkeleton } from "./LoadingSkeleton";

type LeaderboardRow = {
  rank: number;
  user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  telegram_username: string | null;
  total_points: number;
  tests_completed: number;
};

function getRankVisual(rank: number) {
  if (rank === 1) {
    return {
      row: "bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-50 border-amber-300/80",
      badge: "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950 shadow-sm",
      icon: <Trophy className="h-4 w-4" aria-hidden />,
      label: "Золото · 1 место",
      avatar: "bg-amber-200/80 text-amber-950 border-amber-400/60",
      points: "text-amber-950",
    };
  }
  if (rank === 2) {
    return {
      row: "bg-gradient-to-r from-stone-200/90 via-stone-100 to-stone-50 border-stone-300",
      badge: "bg-gradient-to-br from-stone-200 to-stone-400 text-stone-900 shadow-sm",
      icon: <Medal className="h-4 w-4" aria-hidden />,
      label: "Серебро · 2 место",
      avatar: "bg-stone-200 text-stone-800 border-stone-400/50",
      points: "text-stone-900",
    };
  }
  if (rank === 3) {
    return {
      row: "bg-gradient-to-r from-orange-100 via-orange-50 to-amber-50 border-orange-300/70",
      badge: "bg-gradient-to-br from-orange-300 to-amber-700 text-orange-950 shadow-sm",
      icon: <Award className="h-4 w-4" aria-hidden />,
      label: "Бронза · 3 место",
      avatar: "bg-orange-200/80 text-orange-950 border-orange-400/50",
      points: "text-orange-950",
    };
  }
  return {
    row: "bg-surface-raised border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/80",
    badge: "bg-stone-100 text-stone-600",
    icon: null,
    label: `Место ${rank}`,
    avatar: "bg-primary-50 text-primary-800 border-primary-200",
    points: "text-stone-900",
  };
}

export function LiveLeaderboard({ initialLimit = 25 }: { initialLimit?: number }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(initialLimit);

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
      if (!document.hidden) {
        fetchLeaderboard();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const displayedRows = useMemo(() => rows.slice(0, displayLimit), [rows, displayLimit]);

  if (loading) {
    return (
      <div className="surface-card p-6 sm:p-8 h-full flex flex-col">
        <div className="mb-6 sm:mb-8">
          <h2 className="font-display text-h3 text-stone-950">Мировой рейтинг</h2>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="surface-card p-5 sm:p-7 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <h2 className="font-display text-h3 text-stone-950">Мировой рейтинг</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchLeaderboard}
            disabled={isRefreshing}
            className="text-sm text-primary-800 hover:text-primary-950 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors px-3 py-2 rounded-xl hover:bg-primary-50 min-h-10"
            aria-label="Обновить рейтинг"
          >
            {isRefreshing ? "Обновление..." : "Обновить"}
          </button>
          <span
            className={`text-xs sm:text-sm flex items-center gap-2 px-3 py-2 rounded-xl font-medium ${
              isRefreshing ? "bg-primary-50 text-primary-800" : "bg-emerald-50 text-emerald-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isRefreshing ? "bg-primary-600 animate-pulse" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {isRefreshing ? "Обновление..." : "В реальном времени"}
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-stone-500 py-14 text-sm leading-relaxed">
          Пока нет результатов. Пройдите тест первым.
        </div>
      ) : (
        <ol className="flex-1 space-y-3 sm:space-y-3.5 list-none m-0 p-0">
          {displayedRows.map((r) => {
            const visual = getRankVisual(r.rank);
            const initial = (r.display_name || r.first_name || "?").charAt(0).toUpperCase();
            const isTop3 = r.rank <= 3;

            return (
              <li key={r.user_id}>
                <div
                  className={`rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 transition-colors ${visual.row}`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${visual.badge}`}
                      title={visual.label}
                      aria-label={visual.label}
                    >
                      {visual.icon ?? r.rank}
                    </div>

                    <div className="min-w-0 flex-1 flex items-start gap-3 sm:gap-3.5">
                      <div
                        className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${visual.avatar}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                        <Link
                          href={`/profile?userId=${r.user_id}`}
                          className="block font-semibold text-stone-950 leading-snug break-words hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                        >
                          {r.display_name || "Участник"}
                        </Link>
                        {r.telegram_username ? (
                          <a
                            href={`https://t.me/${r.telegram_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-sm text-stone-500 leading-relaxed hover:underline"
                          >
                            @{r.telegram_username}
                          </a>
                        ) : (
                          <span className="block text-sm text-stone-400 leading-relaxed">
                            {isTop3 ? visual.label : `Место ${r.rank}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right pt-0.5 pl-2">
                      <div
                        className={`font-mono text-base sm:text-lg font-bold tabular-nums leading-none ${visual.points}`}
                      >
                        {r.total_points.toLocaleString("ru-RU")}
                      </div>
                      <div className="mt-1.5 text-xs text-stone-500 leading-relaxed">очков</div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {rows.length > displayLimit && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 25)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 bg-surface-raised px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-50 transition-colors"
          >
            Показать ещё ({rows.length - displayLimit})
          </button>
        </div>
      )}
    </div>
  );
}
