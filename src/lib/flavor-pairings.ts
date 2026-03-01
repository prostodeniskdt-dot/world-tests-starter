import "server-only";
import { db } from "./db";

export type FlavorPairingCategory = "fruits" | "herbs_spices" | "other";

export type FlavorPairingResult = {
  mainIngredient: string;
  pairedIngredients: string[];
  mainCategory: FlavorPairingCategory;
};

/** Получить сочетания для ингредиента */
export async function getPairingsForIngredient(
  ingredient: string
): Promise<FlavorPairingResult | null> {
  const normalized = ingredient.trim();
  if (!normalized) return null;

  const { rows } = await db.query(
    `SELECT main_ingredient, paired_ingredient, main_category
     FROM flavor_pairings
     WHERE LOWER(TRIM(main_ingredient)) = LOWER($1)
     ORDER BY paired_ingredient`,
    [normalized]
  );

  if (rows.length === 0) return null;

  const main = rows[0].main_ingredient as string;
  const category = rows[0].main_category as FlavorPairingCategory;
  const pairedIngredients = rows.map((r) => r.paired_ingredient as string);

  return { mainIngredient: main, pairedIngredients, mainCategory: category };
}

/** Получить случайный ингредиент с сочетаниями */
export async function getRandomPairing(): Promise<FlavorPairingResult | null> {
  const { rows } = await db.query(
    `SELECT main_ingredient, paired_ingredient, main_category
     FROM flavor_pairings
     WHERE main_ingredient = (
       SELECT main_ingredient FROM flavor_pairings
       ORDER BY RANDOM()
       LIMIT 1
     )
     ORDER BY paired_ingredient`
  );

  if (rows.length === 0) return null;

  const main = rows[0].main_ingredient as string;
  const category = rows[0].main_category as FlavorPairingCategory;
  const pairedIngredients = rows.map((r) => r.paired_ingredient as string);

  return { mainIngredient: main, pairedIngredients, mainCategory: category };
}

/** Список всех основных ингредиентов (для автокомплита) */
export async function getAllMainIngredients(): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT main_ingredient FROM flavor_pairings ORDER BY main_ingredient`
  );
  return rows.map((r) => r.main_ingredient as string);
}

/** Список ингредиентов по категории */
export async function getIngredientsByCategory(
  category: FlavorPairingCategory
): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT main_ingredient FROM flavor_pairings
     WHERE main_category = $1
     ORDER BY main_ingredient`,
    [category]
  );
  return rows.map((r) => r.main_ingredient as string);
}
