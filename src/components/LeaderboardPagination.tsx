"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export function LeaderboardPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pageInput, setPageInput] = useState("");

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/leaderboard?${params.toString()}`;
  };

  const handlePageInput = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      router.push(createPageUrl(page));
      setPageInput("");
    }
  };

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={createPageUrl(currentPage - 1)}
          className={`px-4 py-2 border rounded-md transition-colors ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed pointer-events-none"
              : "hover:bg-zinc-800"
          }`}
          aria-label="Предыдущая страница"
        >
          Назад
        </Link>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => (
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400" aria-hidden="true">...</span>
            ) : (
              <Link
                key={page}
                href={createPageUrl(page as number)}
                className={`px-3 py-2 border rounded-md transition-colors ${
                  currentPage === page
                    ? "bg-white text-white border-white"
                    : "hover:bg-zinc-800"
                }`}
                aria-label={`Страница ${page}${currentPage === page ? ', текущая страница' : ''}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Link>
            )
          ))}
        </div>
        
        <Link
          href={createPageUrl(currentPage + 1)}
          className={`px-4 py-2 border rounded-md transition-colors ${
            currentPage >= totalPages
              ? "opacity-50 cursor-not-allowed pointer-events-none"
              : "hover:bg-zinc-800"
          }`}
          aria-label="Следующая страница"
        >
          Вперед
        </Link>
      </div>
      
      <form onSubmit={handlePageInput} className="flex items-center gap-2">
        <span className="text-sm text-zinc-400">Перейти к:</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          placeholder={currentPage.toString()}
          className="w-20 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          aria-label="Номер страницы"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-white text-white rounded-md hover:bg-zinc-500 transition-colors text-sm"
          aria-label="Перейти на страницу"
        >
          Перейти
        </button>
      </form>
      
      <span className="text-sm text-zinc-400">
        Страница {currentPage} из {totalPages}
      </span>
    </div>
  );
}
