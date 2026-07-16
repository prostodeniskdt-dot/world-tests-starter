/**
 * Нормализация и русификация названий ингредиентов.
 */

const CYRILLIC = /[а-яА-ЯёЁ]/;

const GARBLED_PATTERN =
  /[''`]ii|cii|;\!|\$\s*$|cupua|^[0-9\s'"!$;:.,-]+$/i;

export function isGarbledIngredient(name: string): boolean {
  const s = name.trim();
  if (!s || s.length < 2) return true;
  if (GARBLED_PATTERN.test(s)) return true;
  const letters = s.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, "");
  return letters.length < 2;
}

export function hasCyrillic(name: string): boolean {
  return CYRILLIC.test(name);
}

export function normalizeIngredientForm(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/ё/g, "е");
}

export function extractRussianIngredient(
  ingredient: string | null | undefined,
  original: string | null | undefined
): string | null {
  const candidates: string[] = [];

  if (ingredient?.trim()) candidates.push(ingredient.trim());

  if (original?.trim()) {
    for (const part of original.split("|")) {
      const p = part.trim();
      if (p) candidates.push(p);
    }
  }

  for (const raw of candidates) {
    if (!hasCyrillic(raw) || isGarbledIngredient(raw)) continue;
    return normalizeIngredientForm(raw);
  }

  return null;
}

export function isValidRussianIngredient(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  return hasCyrillic(name) && !isGarbledIngredient(name);
}

export function displayIngredient(name: string): string {
  const n = name.trim();
  if (!n) return n;
  return n.charAt(0).toUpperCase() + n.slice(1);
}

/** SQL-фрагмент для фильтра валидных русских ингредиентов */
export const VALID_RUSSIAN_INGREDIENT_SQL = `
  main_ingredient ~ '[а-яА-ЯёЁ]'
  AND length(trim(main_ingredient)) >= 2
  AND main_ingredient !~ '''ii'
  AND main_ingredient !~ 'cii'
  AND main_ingredient !~ ';!'
`;

export const VALID_RUSSIAN_PAIRED_SQL = `
  paired_ingredient ~ '[а-яА-ЯёЁ]'
  AND length(trim(paired_ingredient)) >= 2
  AND paired_ingredient !~ '''ii'
  AND paired_ingredient !~ 'cii'
  AND paired_ingredient !~ ';!'
`;
