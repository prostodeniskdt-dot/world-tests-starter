import "server-only";
import { COCKTAIL_BASE_1_PUBLIC } from "@/tests/cocktail-base-1/public";
import { COCKTAIL_BASE_1_SECRET } from "@/tests/cocktail-base-1/answer";
import { COCKTAIL_PRACTICE_2_PUBLIC } from "@/tests/cocktail-practice-2/public";
import { COCKTAIL_PRACTICE_2_SECRET } from "@/tests/cocktail-practice-2/answer";
import { COCKTAIL_ADVANCED_3_PUBLIC } from "@/tests/cocktail-advanced-3/public";
import { COCKTAIL_ADVANCED_3_SECRET } from "@/tests/cocktail-advanced-3/answer";

import { CARBONIZATION_BASE_1_PUBLIC } from "@/tests/carbonization-base-1/public";
import { CARBONIZATION_BASE_1_SECRET } from "@/tests/carbonization-base-1/answer";
import { CARBONIZATION_PRACTICE_2_PUBLIC } from "@/tests/carbonization-practice-2/public";
import { CARBONIZATION_PRACTICE_2_SECRET } from "@/tests/carbonization-practice-2/answer";
import { CARBONIZATION_ADVANCED_3_PUBLIC } from "@/tests/carbonization-advanced-3/public";
import { CARBONIZATION_ADVANCED_3_SECRET } from "@/tests/carbonization-advanced-3/answer";

import { MIXOLOGY_PRACTICE_2_PUBLIC } from "@/tests/mixology-practice-2/public";
import { MIXOLOGY_PRACTICE_2_SECRET } from "@/tests/mixology-practice-2/answer";
import { MIXOLOGY_ADVANCED_3_PUBLIC } from "@/tests/mixology-advanced-3/public";
import { MIXOLOGY_ADVANCED_3_SECRET } from "@/tests/mixology-advanced-3/answer";

// Типы (экспортируем для использования в других файлах)
export type { PublicTest, PublicTestQuestion } from "@/tests/types";

// Реестр всех публичных тестов (без правильных ответов)
export const PUBLIC_TESTS = [
  COCKTAIL_BASE_1_PUBLIC,
  COCKTAIL_PRACTICE_2_PUBLIC,
  COCKTAIL_ADVANCED_3_PUBLIC,
  CARBONIZATION_BASE_1_PUBLIC,
  CARBONIZATION_PRACTICE_2_PUBLIC,
  CARBONIZATION_ADVANCED_3_PUBLIC,
  MIXOLOGY_PRACTICE_2_PUBLIC,
  MIXOLOGY_ADVANCED_3_PUBLIC,
] as const;

// Реестр всех секретных тестов (с правильными ответами)
export const SECRET_TESTS = [
  COCKTAIL_BASE_1_SECRET,
  COCKTAIL_PRACTICE_2_SECRET,
  COCKTAIL_ADVANCED_3_SECRET,
  CARBONIZATION_BASE_1_SECRET,
  CARBONIZATION_PRACTICE_2_SECRET,
  CARBONIZATION_ADVANCED_3_SECRET,
  MIXOLOGY_PRACTICE_2_SECRET,
  MIXOLOGY_ADVANCED_3_SECRET,
] as const;

// Мапы для быстрого доступа по ID
export const PUBLIC_TESTS_MAP: Record<string, typeof COCKTAIL_BASE_1_PUBLIC> = Object.fromEntries(
  PUBLIC_TESTS.map((test) => [test.id, test])
);

export const SECRET_TESTS_MAP: Record<string, typeof COCKTAIL_BASE_1_SECRET> = Object.fromEntries(
  SECRET_TESTS.map((test) => [test.id, test])
);

// Функции для работы с категориями
export function getTestsByCategory() {
  const categories = new Set(PUBLIC_TESTS.map(t => t.category));
  const result: Record<string, typeof PUBLIC_TESTS[number][]> = {};
  
  for (const category of categories) {
    result[category] = PUBLIC_TESTS.filter(t => t.category === category);
  }
  
  return result;
}

export function getCategories() {
  return Array.from(new Set(PUBLIC_TESTS.map(t => t.category))).sort();
}

// Валидация структуры тестов
if (PUBLIC_TESTS.some(t => !t.category)) {
  throw new Error("Some tests are missing category field");
}
