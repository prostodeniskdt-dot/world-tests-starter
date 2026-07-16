import "server-only";
import { db } from "./db";
import {
  normalizeIngredientForm,
  isValidRussianIngredient,
} from "./ingredient-normalize";

export type FlavorPairingCategory = "fruits" | "herbs_spices" | "other";

export type FlavorPairingResult = {
  mainIngredient: string;
  pairedIngredients: string[];
  mainCategory: FlavorPairingCategory;
};

const VALID_MAIN_WHERE = `
  main_ingredient ~ '[а-яА-ЯёЁ]'
  AND length(trim(main_ingredient)) >= 2
  AND main_ingredient !~ '''ii'
  AND main_ingredient !~ 'cii'
`;

const VALID_PAIRED_WHERE = `
  paired_ingredient ~ '[а-яА-ЯёЁ]'
  AND length(trim(paired_ingredient)) >= 2
  AND paired_ingredient !~ '''ii'
  AND paired_ingredient !~ 'cii'
`;

function filterValidNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const n = normalizeIngredientForm(name);
    if (!isValidRussianIngredient(n) || seen.has(n)) continue;
    seen.add(n);
    result.push(n);
  }
  return result.sort((a, b) => a.localeCompare(b, "ru"));
}

/** Получить сочетания для ингредиента */
export async function getPairingsForIngredient(
  ingredient: string
): Promise<FlavorPairingResult | null> {
  const normalized = normalizeIngredientForm(ingredient.trim());
  if (!normalized || !isValidRussianIngredient(normalized)) return null;

  const { rows } = await db.query(
    `SELECT main_ingredient, paired_ingredient, main_category
     FROM flavor_pairings
     WHERE LOWER(TRIM(main_ingredient)) = $1
       AND ${VALID_PAIRED_WHERE}
     ORDER BY paired_ingredient`,
    [normalized]
  );

  if (rows.length === 0) return null;

  const main = normalizeIngredientForm(rows[0].main_ingredient as string);
  const category = rows[0].main_category as FlavorPairingCategory;
  const pairedIngredients = filterValidNames(
    rows.map((r) => r.paired_ingredient as string)
  );

  return { mainIngredient: main, pairedIngredients, mainCategory: category };
}

/** Получить случайный ингредиент с сочетаниями */
export async function getRandomPairing(): Promise<FlavorPairingResult | null> {
  const { rows } = await db.query(
    `SELECT main_ingredient, paired_ingredient, main_category
     FROM flavor_pairings
     WHERE ${VALID_MAIN_WHERE}
       AND main_ingredient = (
         SELECT main_ingredient FROM flavor_pairings
         WHERE ${VALID_MAIN_WHERE}
         ORDER BY RANDOM()
         LIMIT 1
       )
       AND ${VALID_PAIRED_WHERE}
     ORDER BY paired_ingredient`
  );

  if (rows.length === 0) return null;

  const main = normalizeIngredientForm(rows[0].main_ingredient as string);
  const category = rows[0].main_category as FlavorPairingCategory;
  const pairedIngredients = filterValidNames(
    rows.map((r) => r.paired_ingredient as string)
  );

  return { mainIngredient: main, pairedIngredients, mainCategory: category };
}

/** Список всех основных ингредиентов (только валидные русские) */
export async function getAllMainIngredients(): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT main_ingredient FROM flavor_pairings
     WHERE ${VALID_MAIN_WHERE}
     ORDER BY main_ingredient`
  );
  return filterValidNames(rows.map((r) => r.main_ingredient as string));
}

/** Список ингредиентов по категории */
export async function getIngredientsByCategory(
  category: FlavorPairingCategory
): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT main_ingredient FROM flavor_pairings
     WHERE main_category = $1 AND ${VALID_MAIN_WHERE}
     ORDER BY main_ingredient`,
    [category]
  );
  return filterValidNames(rows.map((r) => r.main_ingredient as string));
}
