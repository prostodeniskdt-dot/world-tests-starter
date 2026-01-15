import type { QuestionMechanic } from "@/tests/types";

/**
 * Определяет механику вопроса на основе текста и структуры
 */
export function detectMechanic(text: string): QuestionMechanic {
  const lowerText = text.toLowerCase();

  // Matching: "соедините", "соответствие", "сопоставьте", "соедини"
  if (
    /соедин|соответств|сопостав|соотнес/i.test(text) ||
    /левая колонка|правая колонка/i.test(text) ||
    /соедини.*термин/i.test(text)
  ) {
    return "matching";
  }

  // Ordering: "расставьте", "упорядочьте", "хронология", "последовательность", "порядок"
  if (
    /расстав|упорядоч|хронология|последовательность|в порядке|порядок/i.test(text) ||
    /от.*к|от причины к следствию/i.test(text)
  ) {
    return "ordering";
  }

  // Multiple select: "выберите все", "несколько правильных", "все верные"
  if (
    /выберите все|несколько правильных|все верные|может быть несколько|несколько ответов/i.test(text) ||
    /все кроме одного/i.test(text)
  ) {
    return "multiple-select";
  }

  // Grouping: "разнесите", "классифицируйте", "группы", "категории"
  if (
    /разнес|классифицир|групп|категори|раздели.*на/i.test(text) ||
    /подходит.*не подходит/i.test(text)
  ) {
    return "grouping";
  }

  // Cloze: "заполните пропуски", "___", "..."
  if (
    /заполн.*пропуск|пропуск|___|\.\.\.|вставьте/i.test(text) ||
    /\{.*\}/.test(text) // Шаблоны вида {0}, {1}
  ) {
    return "cloze-dropdown";
  }

  // Select errors: "найдите ошибки", "выделите ошибки", "найди ошибки"
  if (
    /найдит.*ошиб|выделит.*ошиб|отметьте.*ошиб|укажите.*ошиб/i.test(text) ||
    /ошибк.*в.*текст|ошибк.*в.*код/i.test(text)
  ) {
    return "select-errors";
  }

  // True/False Enhanced: "верно/неверно" + причина
  if (
    /верно.*неверно|верно.*не верно|true.*false/i.test(text) ||
    (/верно|неверно/i.test(text) && /причина|объяснение/i.test(text))
  ) {
    return "true-false-enhanced";
  }

  // Two-step: "двухступенчатый", "сначала выберите", "затем объясните"
  if (
    /двухступенчат|сначала.*затем|шаг.*шаг|первый.*второй/i.test(text) ||
    /выберите.*объясните|выберите.*причина/i.test(text)
  ) {
    return "two-step";
  }

  // Matrix: "таблица", "матрица", "объект.*характеристика"
  if (
    /таблица|матрица|объект.*характеристика|объект.*свойство/i.test(text) ||
    /да.*нет.*по.*критери/i.test(text)
  ) {
    return "matrix";
  }

  // Best example: "лучший пример", "лучшее перефразирование", "правильно применено"
  if (
    /лучший пример|лучшее перефразирование|правильно применено|корректно применено/i.test(text) ||
    /лучший заголовок|правильный вывод/i.test(text)
  ) {
    return "best-example";
  }

  // Scenario: "ситуация", "кейс", "выберите шаги", "приоритеты"
  if (
    /ситуация|кейс|сценарий|выберите.*шаг|приоритет/i.test(text) ||
    /проблема.*действие/i.test(text)
  ) {
    return "scenario";
  }

  // Construct: "соберите", "составьте из блоков", "выберите блоки"
  if (
    /соберите|составьте из блоков|выберите блоки|собери.*из/i.test(text) ||
    /блок.*порядок/i.test(text)
  ) {
    return "construct";
  }

  // По умолчанию: multiple-choice
  return "multiple-choice";
}

/**
 * Определяет вариант matching вопроса
 */
export function detectMatchingVariant(text: string): "1-to-1" | "1-to-many" | "extra-right" | "three-columns" {
  if (/три колонки|термин.*определение.*пример/i.test(text)) {
    return "three-columns";
  }
  if (/лишний|не используется|один.*не нужен/i.test(text)) {
    return "extra-right";
  }
  if (/несколько примеров|много/i.test(text)) {
    return "1-to-many";
  }
  return "1-to-1";
}

/**
 * Определяет тип матрицы
 */
export function detectMatrixType(text: string): "single-select" | "multiple-select" {
  if (/да.*нет|несколько.*критери/i.test(text)) {
    return "multiple-select";
  }
  return "single-select";
}

/**
 * Определяет тип scenario вопроса
 */
export function detectScenarioActionType(text: string): "select" | "order" | "match" {
  if (/приоритет|порядок|расставьте/i.test(text)) {
    return "order";
  }
  if (/сопостав|соотнес/i.test(text)) {
    return "match";
  }
  return "select";
}
