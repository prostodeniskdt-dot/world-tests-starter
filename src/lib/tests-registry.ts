import "server-only";
import { TEST_1_PUBLIC } from "@/tests/test-1.public";
import { TEST_1_SECRET } from "@/tests/test-1.answer";

// Типы (экспортируем для использования в других файлах)
export type { PublicTest, PublicTestQuestion } from "@/tests/test-1.public";

// Реестр всех публичных тестов (без правильных ответов)
export const PUBLIC_TESTS = [
  TEST_1_PUBLIC,
  // Добавляйте новые тесты здесь
] as const;

// Реестр всех секретных тестов (с правильными ответами)
export const SECRET_TESTS = [
  TEST_1_SECRET,
  // Добавляйте новые тесты здесь
] as const;

// Мапы для быстрого доступа по ID
export const PUBLIC_TESTS_MAP: Record<string, typeof TEST_1_PUBLIC> = Object.fromEntries(
  PUBLIC_TESTS.map((test) => [test.id, test])
);

export const SECRET_TESTS_MAP: Record<string, typeof TEST_1_SECRET> = Object.fromEntries(
  SECRET_TESTS.map((test) => [test.id, test])
);
