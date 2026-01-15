import type { QuestionMechanic } from "@/tests/types";

/**
 * Все доступные типы механик
 */
export const QUESTION_MECHANICS: QuestionMechanic[] = [
  "multiple-choice",
  "multiple-select",
  "matching",
  "ordering",
  "grouping",
  "true-false-enhanced",
  "cloze-dropdown",
  "select-errors",
  "two-step",
  "matrix",
  "best-example",
  "scenario",
  "construct",
];

/**
 * Названия механик для отображения
 */
export const MECHANIC_NAMES: Record<QuestionMechanic, string> = {
  "multiple-choice": "Выбор одного ответа",
  "multiple-select": "Выбор нескольких ответов",
  "matching": "Соответствия",
  "ordering": "Упорядочивание",
  "grouping": "Группировка",
  "true-false-enhanced": "Верно/Неверно с причиной",
  "cloze-dropdown": "Заполнение пропусков",
  "select-errors": "Найди ошибки",
  "two-step": "Двухступенчатый вопрос",
  "matrix": "Матрица",
  "best-example": "Лучший пример",
  "scenario": "Мини-кейс",
  "construct": "Собери из блоков",
};

/**
 * Проверяет, является ли механика валидной
 */
export function isValidMechanic(mechanic: string): mechanic is QuestionMechanic {
  return QUESTION_MECHANICS.includes(mechanic as QuestionMechanic);
}

/**
 * Получает название механики
 */
export function getMechanicName(mechanic: QuestionMechanic): string {
  return MECHANIC_NAMES[mechanic] || mechanic;
}
