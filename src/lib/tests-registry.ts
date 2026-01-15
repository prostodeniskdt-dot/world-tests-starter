import "server-only";
import { COCKTAIL_SYSTEM_1_PUBLIC } from "@/tests/cocktail-system-1/public";
import { COCKTAIL_SYSTEM_1_SECRET } from "@/tests/cocktail-system-1/answer";
import { BALANCE_PRACTICE_1_PUBLIC } from "@/tests/balance-practice-1/public";
import { BALANCE_PRACTICE_1_SECRET } from "@/tests/balance-practice-1/answer";
import { ENGINEERING_1_PUBLIC } from "@/tests/engineering-1/public";
import { ENGINEERING_1_SECRET } from "@/tests/engineering-1/answer";
import { CARBONIZATION_FUNDAMENTALS_PUBLIC } from "@/tests/carbonization-fundamentals/public";
import { CARBONIZATION_FUNDAMENTALS_SECRET } from "@/tests/carbonization-fundamentals/answer";
import { CARBONIZATION_PRACTICE_PUBLIC } from "@/tests/carbonization-practice/public";
import { CARBONIZATION_PRACTICE_SECRET } from "@/tests/carbonization-practice/answer";
import { CARBONIZATION_ADVANCED_PUBLIC } from "@/tests/carbonization-advanced/public";
import { CARBONIZATION_ADVANCED_SECRET } from "@/tests/carbonization-advanced/answer";

// Типы (экспортируем для использования в других файлах)
export type { PublicTest, PublicTestQuestion } from "@/tests/types";

// Реестр всех публичных тестов (без правильных ответов)
export const PUBLIC_TESTS = [
  COCKTAIL_SYSTEM_1_PUBLIC,
  BALANCE_PRACTICE_1_PUBLIC,
  ENGINEERING_1_PUBLIC,
  CARBONIZATION_FUNDAMENTALS_PUBLIC,
  CARBONIZATION_PRACTICE_PUBLIC,
  CARBONIZATION_ADVANCED_PUBLIC,
] as const;

// Реестр всех секретных тестов (с правильными ответами)
export const SECRET_TESTS = [
  COCKTAIL_SYSTEM_1_SECRET,
  BALANCE_PRACTICE_1_SECRET,
  ENGINEERING_1_SECRET,
  CARBONIZATION_FUNDAMENTALS_SECRET,
  CARBONIZATION_PRACTICE_SECRET,
  CARBONIZATION_ADVANCED_SECRET,
] as const;

// Мапы для быстрого доступа по ID
export const PUBLIC_TESTS_MAP: Record<string, typeof COCKTAIL_SYSTEM_1_PUBLIC> = Object.fromEntries(
  PUBLIC_TESTS.map((test) => [test.id, test])
);

export const SECRET_TESTS_MAP: Record<string, typeof COCKTAIL_SYSTEM_1_SECRET> = Object.fromEntries(
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
