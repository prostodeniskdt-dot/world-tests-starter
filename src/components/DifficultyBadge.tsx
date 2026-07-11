"use client";

const LABELS: Record<1 | 2 | 3, string> = {
  1: "Простой",
  2: "Средний",
  3: "Сложный",
};

const STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-stone-100 text-stone-700",
  2: "bg-primary-50 text-primary-800",
  3: "bg-accent-100 text-accent-800",
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
