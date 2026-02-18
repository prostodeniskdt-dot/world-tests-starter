"use client";

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

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-12 text-center">
        <p className="text-zinc-500">Пока нет результатов. Пройди тест первым 🙂</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-zinc-200 bg-white shadow-soft">
      {/* Мобильный вид - карточки */}
      <div className="block sm:hidden space-y-3 p-4">
        {rows.map((r) => {
          const fullName = `${r.first_name || ""} ${r.last_name || ""}`.trim();
          const rankStyle = getRankStyle(r.rank);
          const rankIcon = getRankIcon(r.rank);
          return (
            <div 
              key={r.user_id} 
              className={`rounded-lg border-2 p-4 ${getRankRowClass(r.rank)} ${rankStyle.className}`}
              style={rankStyle.style}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-bold">
                  {rankIcon}
                  <span>#{r.rank}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{r.total_points.toLocaleString()}</div>
                  <div className="text-xs opacity-80">{r.tests_completed} тестов</div>
                </div>
              </div>
              <Link
                href={`/profile?userId=${r.user_id}`}
                className="flex items-center gap-3"
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  r.rank <= 3 
                    ? "bg-white/80 text-zinc-800 border border-zinc-300/80" 
                    : "bg-zinc-800 text-zinc-700"
                }`}>
                  {r.first_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{fullName || "Без имени"}</div>
                  <div className="text-xs opacity-80 truncate">{r.email}</div>
                  {r.telegram_username && (
                    <a
                      href={`https://t.me/${r.telegram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline truncate block"
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
            const isTop3 = r.rank <= 3;
            return (
              <tr
                key={r.user_id}
                className={`border-b border-zinc-200 last:border-b-0 transition-colors ${getRankRowClass(r.rank)} ${rankStyle.className} ${!isTop3 ? "hover:bg-zinc-50" : ""}`}
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
                        : "bg-zinc-800 text-zinc-700"
                    }`}>
                      {r.first_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-semibold">{fullName || "Без имени"}</div>
                      <div className="text-xs opacity-80">{r.email}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4" style={rankStyle.style}>
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
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
                <td className="px-4 py-4 font-bold text-right" style={rankStyle.style}>{r.total_points.toLocaleString()}</td>
                <td className="px-4 py-4 text-right" style={rankStyle.style}>{r.tests_completed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
