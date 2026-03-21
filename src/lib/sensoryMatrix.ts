/** Фиксированные оси сенсорной матрицы (1–5, как на референсе карточки). */
export const SENSORY_KEYS = ["sweetness", "acidity", "aromaticity", "body"] as const;
export type SensoryKey = (typeof SENSORY_KEYS)[number];

const LABELS_RU: Record<SensoryKey, string> = {
  sweetness: "Сладость",
  acidity: "Кислотность",
  aromaticity: "Ароматичность",
  body: "Тело",
};

export function sensoryLabelRu(key: string): string {
  if (SENSORY_KEYS.includes(key as SensoryKey)) return LABELS_RU[key as SensoryKey];
  return key;
}

/** Нормализация объекта { sweetness: 3, ... } в диапазоне 1–5. */
export function normalizeSensoryMatrix(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const key of SENSORY_KEYS) {
    const v = o[key];
    if (v == null || v === "") continue;
    const n = Math.round(Number(v));
    if (Number.isFinite(n) && n >= 1 && n <= 5) out[key] = n;
  }
  return out;
}
