import type { DrinkType } from "@/lib/alcoholDrinkTypes";
import { sensoryKeysForDrinkType } from "@/lib/alcoholDrinkTypes";

/** Лейблы осей сенсорики (1–5), включая устаревший ключ aromaticity. */
const LABELS_RU: Record<string, string> = {
  body: "Тело (лёгкое — полное)",
  sweetness: "Сладость",
  intensity: "Интенсивность / аромат",
  aromaticity: "Ароматичность",
  acidity: "Кислотность",
  peat_smoke: "Дымность / торф",
  bitterness: "Горечь",
  texture: "Текстура / маслянистость",
};

/** Все ключи, которые когда-либо сохранялись в проекте. */
export const ALL_KNOWN_SENSORY_KEYS = [
  "body",
  "sweetness",
  "intensity",
  "aromaticity",
  "acidity",
  "peat_smoke",
  "bitterness",
  "texture",
] as const;

/** @deprecated используйте sensoryKeysForDrinkType и ALL_KNOWN_SENSORY_KEYS */
export const SENSORY_KEYS = ["sweetness", "acidity", "aromaticity", "body"] as const;
export type SensoryKey = (typeof SENSORY_KEYS)[number];

export function sensoryLabelRu(key: string): string {
  return LABELS_RU[key] ?? key;
}

function clamp15(n: number): number | null {
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r < 1 || r > 5) return null;
  return r;
}

/**
 * Нормализация сенсорики: только ключи, разрешённые для drink_type, значения 1–5.
 */
export function normalizeSensoryMatrix(raw: unknown, drinkType: DrinkType): Record<string, number> {
  const allowed = new Set(sensoryKeysForDrinkType(drinkType));
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const key of allowed) {
    const v = o[key];
    if (v == null || v === "") continue;
    const n = clamp15(Number(v));
    if (n != null) out[key] = n;
  }
  return out;
}

/**
 * Для отображения карточки: все оси из JSON с валидными значениями (в т.ч. legacy aromaticity).
 */
export function parseSensoryForDisplay(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(o)) {
    if (val == null || val === "") continue;
    const n = clamp15(Number(val));
    if (n != null) out[key] = n;
  }
  return out;
}
