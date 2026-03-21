/**
 * Тип напитка (drink_type) — отдельно от category_id (раздел каталога на сайте).
 * Управляет осями сенсорики, плейсхолдерами и подписями блоков.
 */

export const DRINK_TYPES = [
  "wine",
  "whisky",
  "beer",
  "gin",
  "rum",
  "tequila",
  "liqueur",
  "cognac_brandy",
  "vodka",
  "sake",
  "cider",
  "bitter_amaro",
  "other",
] as const;

export type DrinkType = (typeof DRINK_TYPES)[number];

export type DrinkTypeConfig = {
  label: string;
  primaryIngredientPlaceholder: string;
  maturationTitle: string;
  maturationPlaceholder: string;
  productionTitle: string;
  productionPlaceholder: string;
  /** Ключи sensory_matrix 1–5 */
  sensoryKeys: readonly string[];
};

export const DRINK_TYPE_CONFIG: Record<DrinkType, DrinkTypeConfig> = {
  wine: {
    label: "Вино",
    primaryIngredientPlaceholder: "Например: Каберне Совиньон, Мерло…",
    maturationTitle: "Выдержка",
    maturationPlaceholder: "Срок, ёмкость: дуб, бурбонные бочки, нержавейка…",
    productionTitle: "Способ производства",
    productionPlaceholder: "Ферментация, выдержка, метод шампенуаз…",
    sensoryKeys: ["body", "sweetness", "intensity", "acidity"],
  },
  whisky: {
    label: "Виски",
    primaryIngredientPlaceholder: "Например: ячмень, кукуруза, рожь…",
    maturationTitle: "Выдержка",
    maturationPlaceholder: "Срок, тип бочек (бурбон, шери, винный дуб…)",
    productionTitle: "Дистилляция и производство",
    productionPlaceholder: "Pot still, двойная дистилляция, купаж…",
    sensoryKeys: ["body", "sweetness", "intensity", "peat_smoke", "texture"],
  },
  beer: {
    label: "Пиво",
    primaryIngredientPlaceholder: "Например: солод ячменный, хмель…",
    maturationTitle: "Ферментация",
    maturationPlaceholder: "Верховое, низовое, спонтанное, смешанное…",
    productionTitle: "Производство",
    productionPlaceholder: "Варка, сухое охмеление, лагеринг…",
    sensoryKeys: ["body", "sweetness", "intensity", "acidity", "bitterness"],
  },
  gin: {
    label: "Джин",
    primaryIngredientPlaceholder: "Например: зерновой спирт, основа…",
    maturationTitle: "Выдержка (если есть)",
    maturationPlaceholder: "Чаще нейтральный спирт; если есть контакт с дубом — укажите",
    productionTitle: "Производство / дистилляция",
    productionPlaceholder: "London Dry, дистиллят ботаникалов, купаж…",
    sensoryKeys: ["body", "sweetness", "intensity", "bitterness", "texture"],
  },
  rum: {
    label: "Ром",
    primaryIngredientPlaceholder: "Например: тростниковый сироп, патока…",
    maturationTitle: "Выдержка",
    maturationPlaceholder: "Срок, бочки (бурбон, коньячные…)",
    productionTitle: "Производство",
    productionPlaceholder: "Колонный / горшочный перегон, купаж…",
    sensoryKeys: ["body", "sweetness", "intensity", "texture"],
  },
  tequila: {
    label: "Текила / мескаль",
    primaryIngredientPlaceholder: "Например: агава голубая (Weber)…",
    maturationTitle: "Выдержка",
    maturationPlaceholder: "Blanco / reposado / añejo — срок и ёмкость",
    productionTitle: "Производство",
    productionPlaceholder: "Печение агавы, дрожжи, перегон…",
    sensoryKeys: ["body", "sweetness", "intensity", "peat_smoke", "texture"],
  },
  liqueur: {
    label: "Ликёр",
    primaryIngredientPlaceholder: "Например: спирт, сахар, основа…",
    maturationTitle: "Выдержка / настаивание",
    maturationPlaceholder: "Срок настоя, ёмкость",
    productionTitle: "Производство",
    productionPlaceholder: "Мацерация, сахар, купаж…",
    sensoryKeys: ["body", "sweetness", "intensity", "bitterness"],
  },
  cognac_brandy: {
    label: "Коньяк / бренди",
    primaryIngredientPlaceholder: "Например: виноград Уни блан, Коломбар…",
    maturationTitle: "Выдержка",
    maturationPlaceholder: "Срок, Limousin / Tronçais, влажность погреба…",
    productionTitle: "Производство",
    productionPlaceholder: "Двойная дистилляция в Charentais, купаж…",
    sensoryKeys: ["body", "sweetness", "intensity", "texture"],
  },
  vodka: {
    label: "Водка",
    primaryIngredientPlaceholder: "Например: зерно, картофель…",
    maturationTitle: "Выдержка (если есть)",
    maturationPlaceholder: "Обычно без выдержки; фильтрация через уголь и т.д.",
    productionTitle: "Производство",
    productionPlaceholder: "Колонная перегонка, разбавление, фильтрация…",
    sensoryKeys: ["body", "sweetness", "intensity", "texture"],
  },
  sake: {
    label: "Саке",
    primaryIngredientPlaceholder: "Например: рис, koji, вода…",
    maturationTitle: "Выдержка / созревание",
    maturationPlaceholder: "Холодное хранение, срок",
    productionTitle: "Производство",
    productionPlaceholder: "Полировка риса, многократное брожение…",
    sensoryKeys: ["body", "sweetness", "intensity", "acidity"],
  },
  cider: {
    label: "Сидр",
    primaryIngredientPlaceholder: "Например: яблоки сортов…",
    maturationTitle: "Ферментация / выдержка",
    maturationPlaceholder: "Дикие дрожжи, бочка, pet-nat…",
    productionTitle: "Производство",
    productionPlaceholder: "Добыча сока, брожение, газация…",
    sensoryKeys: ["body", "sweetness", "intensity", "acidity"],
  },
  bitter_amaro: {
    label: "Биттер / амаро",
    primaryIngredientPlaceholder: "Например: спирт, трава, корень…",
    maturationTitle: "Настаивание / выдержка",
    maturationPlaceholder: "Срок настоя, ёмкость",
    productionTitle: "Производство",
    productionPlaceholder: "Мацерация, сахар, купаж трав…",
    sensoryKeys: ["bitterness", "sweetness", "intensity", "body"],
  },
  other: {
    label: "Другое",
    primaryIngredientPlaceholder: "Основное сырьё или состав…",
    maturationTitle: "Выдержка / ферментация",
    maturationPlaceholder: "По ситуации",
    productionTitle: "Производство",
    productionPlaceholder: "Технология, особенности…",
    sensoryKeys: ["body", "sweetness", "intensity"],
  },
};

export function isDrinkType(v: string): v is DrinkType {
  return (DRINK_TYPES as readonly string[]).includes(v);
}

export function normalizeDrinkType(v: unknown): DrinkType {
  const s = v != null ? String(v).trim() : "";
  if (isDrinkType(s)) return s;
  return "other";
}

export function sensoryKeysForDrinkType(dt: DrinkType): readonly string[] {
  return DRINK_TYPE_CONFIG[dt].sensoryKeys;
}
