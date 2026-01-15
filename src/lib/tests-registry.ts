import "server-only";
import { COCKTAIL_FOUNDATION_A_PUBLIC } from "@/tests/cocktail-foundation-a/public";
import { COCKTAIL_FOUNDATION_A_SECRET } from "@/tests/cocktail-foundation-a/answer";
import { COCKTAIL_PRACTICE_B_PUBLIC } from "@/tests/cocktail-practice-b/public";
import { COCKTAIL_PRACTICE_B_SECRET } from "@/tests/cocktail-practice-b/answer";
import { COCKTAIL_ANALYSIS_C_PUBLIC } from "@/tests/cocktail-analysis-c/public";
import { COCKTAIL_ANALYSIS_C_SECRET } from "@/tests/cocktail-analysis-c/answer";

import { CARBONIZATION_BASE_1_PUBLIC } from "@/tests/carbonization-base-1/public";
import { CARBONIZATION_BASE_1_SECRET } from "@/tests/carbonization-base-1/answer";
import { CARBONIZATION_PRACTICE_2_PUBLIC } from "@/tests/carbonization-practice-2/public";
import { CARBONIZATION_PRACTICE_2_SECRET } from "@/tests/carbonization-practice-2/answer";
import { CARBONIZATION_ADVANCED_3_PUBLIC } from "@/tests/carbonization-advanced-3/public";
import { CARBONIZATION_ADVANCED_3_SECRET } from "@/tests/carbonization-advanced-3/answer";

// Типы (экспортируем для использования в других файлах)
export type { PublicTest, PublicTestQuestion } from "@/tests/types";

// Реестр всех публичных тестов (без правильных ответов)
export const PUBLIC_TESTS = [
  COCKTAIL_FOUNDATION_A_PUBLIC,
  COCKTAIL_PRACTICE_B_PUBLIC,
  COCKTAIL_ANALYSIS_C_PUBLIC,
  CARBONIZATION_BASE_1_PUBLIC,
  CARBONIZATION_PRACTICE_2_PUBLIC,
  CARBONIZATION_ADVANCED_3_PUBLIC,
] as const;

// Реестр всех секретных тестов (с правильными ответами)
export const SECRET_TESTS = [
  COCKTAIL_FOUNDATION_A_SECRET,
  COCKTAIL_PRACTICE_B_SECRET,
  COCKTAIL_ANALYSIS_C_SECRET,
  CARBONIZATION_BASE_1_SECRET,
  CARBONIZATION_PRACTICE_2_SECRET,
  CARBONIZATION_ADVANCED_3_SECRET,
] as const;

// Мапы для быстрого доступа по ID
export const PUBLIC_TESTS_MAP: Record<string, typeof COCKTAIL_FOUNDATION_A_PUBLIC> = Object.fromEntries(
  PUBLIC_TESTS.map((test) => [test.id, test])
);

export const SECRET_TESTS_MAP: Record<string, typeof COCKTAIL_FOUNDATION_A_SECRET> = Object.fromEntries(
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
