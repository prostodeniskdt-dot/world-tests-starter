/**
 * Категории Б/А ингредиентов: условные поля (category_specific) и режим только category_extra.
 * Slug должен совпадать с na_categories.slug в БД.
 */

export type NaFieldType = "text" | "number" | "boolean" | "select";

export type NaFieldDef = {
  key: string;
  label: string;
  type: NaFieldType;
  options?: { value: string; label: string }[];
  maxLen?: number;
};

export type NaCategoryConfigEntry = {
  label: string;
  /** Поля в category_specific */
  fields: NaFieldDef[];
  /** Только свободные характеристики в category_extra (без жёстких ключей specific) */
  extraOnly?: boolean;
};

export const NA_CATEGORY_CONFIG: Record<string, NaCategoryConfigEntry> = {
  syrups: {
    label: "Сиропы",
    fields: [
      {
        key: "base",
        label: "Основа",
        type: "select",
        options: [
          { value: "sugar", label: "Сахарный" },
          { value: "agave", label: "На агаве" },
          { value: "sugar_free", label: "Без сахара" },
          { value: "erythritol", label: "На эритрите" },
          { value: "other", label: "Другое" },
        ],
      },
      { key: "sugar_brix", label: "Содержание сахара / Brix", type: "text", maxLen: 200 },
      { key: "shelf_life_opened", label: "Срок хранения после вскрытия", type: "text", maxLen: 500 },
    ],
  },
  purees_jams: {
    label: "Пюре / джемы / конфитюры",
    fields: [
      { key: "fruit_percent", label: "Содержание фрукта (%)", type: "number" },
      { key: "has_chunks", label: "Наличие кусочков", type: "boolean" },
      { key: "pasteurized", label: "Пастеризация", type: "boolean" },
      { key: "storage", label: "Срок / условия хранения", type: "text", maxLen: 800 },
    ],
  },
  tonics_sodas: {
    label: "Тоники / газировки / лимонады",
    fields: [
      { key: "carbonated", label: "Газация", type: "boolean" },
      { key: "sugar_content", label: "Содержание сахара", type: "text", maxLen: 200 },
      { key: "quinine", label: "Хинин (для тоников)", type: "boolean" },
      { key: "calories", label: "Калорийность", type: "text", maxLen: 200 },
    ],
  },
  juices: {
    label: "Соки / фреши / нектар",
    fields: [
      {
        key: "juice_type",
        label: "Тип",
        type: "select",
        options: [
          { value: "fresh_press", label: "Прямой отжим" },
          { value: "reconstituted", label: "Восстановленный" },
          { value: "concentrate", label: "Концентрат" },
        ],
      },
      { key: "fruit_percent", label: "Содержание фрукта (%)", type: "number" },
      { key: "pasteurized", label: "Пастеризация", type: "boolean" },
    ],
  },
  spices_herbs: {
    label: "Специи / травы / пряности",
    fields: [
      {
        key: "form",
        label: "Форма",
        type: "select",
        options: [
          { value: "fresh", label: "Свежая" },
          { value: "dried", label: "Сушёная" },
          { value: "ground", label: "Молотая" },
          { value: "whole", label: "Целая" },
        ],
      },
      { key: "recommended_dose", label: "Рекомендуемая дозировка", type: "text", maxLen: 400 },
      { key: "usage_method", label: "Способ использования", type: "text", maxLen: 500 },
    ],
  },
  milk_plant_milk_cream: {
    label: "Молочные / растительное молоко / сливки",
    fields: [
      { key: "fat_percent", label: "Жирность (%)", type: "number" },
      { key: "milk_type", label: "Тип (коровье, овсяное…)", type: "text", maxLen: 200 },
      {
        key: "foam_rating",
        label: "Пенообразование",
        type: "select",
        options: [
          { value: "good", label: "Хорошо" },
          { value: "medium", label: "Средне" },
          { value: "poor", label: "Плохо" },
        ],
      },
    ],
  },
  toppings_garnish: {
    label: "Топинги / гарниши / декор",
    fields: [
      {
        key: "edible_type",
        label: "Тип",
        type: "select",
        options: [
          { value: "edible", label: "Съедобный" },
          { value: "decorative", label: "Декоративный" },
        ],
      },
      { key: "serve_how", label: "Способ подачи", type: "text", maxLen: 500 },
    ],
  },
  ice: {
    label: "Лёд",
    fields: [
      { key: "ice_shape", label: "Форма (куб, сфера…)", type: "text", maxLen: 200 },
      { key: "ice_size", label: "Размер", type: "text", maxLen: 200 },
      { key: "ice_notes", label: "Особенности", type: "text", maxLen: 800 },
    ],
  },
  bitters_na: {
    label: "Биттеры (безалкогольные)",
    extraOnly: true,
    fields: [],
  },
  sauces_shrubs_cordials: {
    label: "Соусы / шринки / кордиалы",
    extraOnly: true,
    fields: [],
  },
  tea_coffee_cocoa: {
    label: "Чай / кофе / какао",
    extraOnly: true,
    fields: [],
  },
  other: {
    label: "Другое",
    extraOnly: true,
    fields: [],
  },
};

export function naConfigForCategorySlug(slug: string | null | undefined): NaCategoryConfigEntry | null {
  if (!slug) return null;
  return NA_CATEGORY_CONFIG[slug] ?? null;
}

export function isNaExtraOnlyCategory(slug: string | null | undefined): boolean {
  const c = naConfigForCategorySlug(slug);
  return Boolean(c?.extraOnly);
}
