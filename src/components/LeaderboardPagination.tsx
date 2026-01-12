"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LeaderboardPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/leaderboard?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        href={createPageUrl(currentPage - 1)}
        className={`px-4 py-2 border rounded-md ${
          currentPage === 1
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "hover:bg-zinc-50"
        }`}
      >
        Назад
      </Link>
      
      <span className="px-4 py-2 text-sm text-zinc-600">
        Страница {currentPage} из {totalPages}
      </span>
      
      <Link
        href={createPageUrl(currentPage + 1)}
        className={`px-4 py-2 border rounded-md ${
          currentPage >= totalPages
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "hover:bg-zinc-50"
        }`}
      >
        Вперед
      </Link>
    </div>
  );
}
