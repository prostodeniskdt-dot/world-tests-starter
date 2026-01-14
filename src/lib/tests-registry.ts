import "server-only";
import { TECHNIQUES_1_PUBLIC } from "@/tests/techniques-1/public";
import { TECHNIQUES_1_SECRET } from "@/tests/techniques-1/answer";
import { TECHNIQUES_2_PUBLIC } from "@/tests/techniques-2/public";
import { TECHNIQUES_2_SECRET } from "@/tests/techniques-2/answer";
import { WHISKEY_1_PUBLIC } from "@/tests/whiskey-1/public";
import { WHISKEY_1_SECRET } from "@/tests/whiskey-1/answer";
import { WHISKEY_2_PUBLIC } from "@/tests/whiskey-2/public";
import { WHISKEY_2_SECRET } from "@/tests/whiskey-2/answer";
import { VODKA_1_PUBLIC } from "@/tests/vodka-1/public";
import { VODKA_1_SECRET } from "@/tests/vodka-1/answer";
import { COCKTAIL_SYSTEM_1_PUBLIC } from "@/tests/cocktail-system-1/public";
import { COCKTAIL_SYSTEM_1_SECRET } from "@/tests/cocktail-system-1/answer";
import { BALANCE_PRACTICE_1_PUBLIC } from "@/tests/balance-practice-1/public";
import { BALANCE_PRACTICE_1_SECRET } from "@/tests/balance-practice-1/answer";
import { ENGINEERING_1_PUBLIC } from "@/tests/engineering-1/public";
import { ENGINEERING_1_SECRET } from "@/tests/engineering-1/answer";

// Типы (экспортируем для использования в других файлах)
export type { PublicTest, PublicTestQuestion } from "@/tests/techniques-1/public";

// Реестр всех публичных тестов (без правильных ответов)
export const PUBLIC_TESTS = [
  TECHNIQUES_1_PUBLIC,
  TECHNIQUES_2_PUBLIC,
  WHISKEY_1_PUBLIC,
  WHISKEY_2_PUBLIC,
  VODKA_1_PUBLIC,
  COCKTAIL_SYSTEM_1_PUBLIC,
  BALANCE_PRACTICE_1_PUBLIC,
  ENGINEERING_1_PUBLIC,
] as const;

// Реестр всех секретных тестов (с правильными ответами)
export const SECRET_TESTS = [
  TECHNIQUES_1_SECRET,
  TECHNIQUES_2_SECRET,
  WHISKEY_1_SECRET,
  WHISKEY_2_SECRET,
  VODKA_1_SECRET,
  COCKTAIL_SYSTEM_1_SECRET,
  BALANCE_PRACTICE_1_SECRET,
  ENGINEERING_1_SECRET,
] as const;

// Мапы для быстрого доступа по ID
export const PUBLIC_TESTS_MAP: Record<string, typeof TECHNIQUES_1_PUBLIC> = Object.fromEntries(
  PUBLIC_TESTS.map((test) => [test.id, test])
);

export const SECRET_TESTS_MAP: Record<string, typeof TECHNIQUES_1_SECRET> = Object.fromEntries(
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
