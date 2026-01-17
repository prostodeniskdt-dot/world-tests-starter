import type { QuestionMechanic } from "@/tests/types";

/**
 * Все доступные типы механик
 */
export const QUESTION_MECHANICS: QuestionMechanic[] = [
  "multiple-choice",
  "multiple-select",
  "true-false-enhanced",
  "cloze-dropdown",
  "select-errors",
  "matching",
  "ordering",
  "grouping",
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
  "true-false-enhanced": "Верно/Неверно с причиной",
  "cloze-dropdown": "Заполнение пропусков",
  "select-errors": "Найди ошибки",
  matching: "Сопоставление",
  ordering: "Упорядочивание",
  grouping: "Группировка",
  "two-step": "Двухшаговый вопрос",
  matrix: "Матрица",
  "best-example": "Лучший пример",
  scenario: "Сценарий",
  construct: "Конструктор",
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
