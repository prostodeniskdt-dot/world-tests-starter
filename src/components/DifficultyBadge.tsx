"use client";

const LABELS: Record<1 | 2 | 3, string> = {
  1: "Простой",
  2: "Средний",
  3: "Сложный",
};

const STYLES: Record<1 | 2 | 3, string> = {
  1: "border border-green-400 bg-green-100 text-green-800",
  2: "border border-amber-400 bg-amber-100 text-amber-800",
  3: "border border-red-400 bg-red-100 text-red-800",
};

export function DifficultyBadge({ level }: { level: 1 | 2 | 3 }) {
  const lvl = level >= 1 && level <= 3 ? level : 1;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${STYLES[lvl as 1 | 2 | 3]}`}
      aria-label={`Сложность: ${LABELS[lvl as 1 | 2 | 3]}`}
    >
      {LABELS[lvl as 1 | 2 | 3]}
    </span>
  );
}
