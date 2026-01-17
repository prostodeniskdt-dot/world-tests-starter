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
