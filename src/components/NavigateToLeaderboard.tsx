"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function NavigateToLeaderboard() {
  const router = useRouter();

  const handleClick = () => {
    try {
      router.push("/tests#leaderboard");
      setTimeout(() => {
        if (!window.location.hash.includes("leaderboard")) {
          window.location.href = "/tests#leaderboard";
        }
      }, 100);
    } catch (error) {
      // В случае ошибки используем полную перезагрузку
      window.location.href = "/tests#leaderboard";
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-zinc-600 underline cursor-pointer bg-transparent border-none p-0"
    >
      Перейти в рейтинг
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
