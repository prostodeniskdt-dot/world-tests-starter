import type { QuestionMechanic } from "@/tests/types";

/**
 * Извлекает механику из скобок в тексте вопроса
 * Формат: *(Mechanic name)* или *(Mechanic name / Alternative)*
 * Или: (Mechanic name) или (Mechanic name / Alternative) без звездочек
 */
function extractMechanicFromParentheses(text: string): QuestionMechanic | null {
  // Сначала пробуем формат со звездочками
  let match = text.match(/\*\(([^)]+)\)\*/);
  // Если не нашли, пробуем формат без звездочек
  if (!match) {
    match = text.match(/\(([^)]+)\)/);
  }
  if (!match) return null;
  
  const mechanicText = match[1].toLowerCase();
  
  // Обрабатываем варианты типа "Best paraphrase / Single select"
  if (mechanicText.includes("single select") || mechanicText.includes("single-select")) {
    return "multiple-choice";
  }
  if (mechanicText.includes("multiple select") || mechanicText.includes("multiple-select")) {
    return "multiple-select";
  }
  if (mechanicText.includes("matching")) {
    return "matching";
  }
  if (mechanicText.includes("ordering")) {
    return "ordering";
  }
  // УДАЛЕНО: grouping не используется в тестах
  // if (mechanicText.includes("grouping") || mechanicText.includes("classification")) {
  //   return "grouping";
  // }
  if (mechanicText.includes("dropdown cloze") || mechanicText.includes("cloze")) {
    return "cloze-dropdown";
  }
  if (mechanicText.includes("true/false") || mechanicText.includes("true-false") || mechanicText.includes("reason")) {
    return "true-false-enhanced";
  }
  if (mechanicText.includes("select errors") || mechanicText.includes("select-errors")) {
    return "select-errors";
  }
  if (mechanicText.includes("two-step") || mechanicText.includes("branching")) {
    return "two-step";
  }
  if (mechanicText.includes("grid") || mechanicText.includes("matrix")) {
    return "matrix";
  }
  // УДАЛЕНО: best-example и scenario не используются в тестах
  // if (mechanicText.includes("best example") || mechanicText.includes("best-example") || mechanicText.includes("best paraphrase")) {
  //   return "best-example";
  // }
  // if (mechanicText.includes("mini-case") || mechanicText.includes("scenario")) {
  //   return "scenario";
  // }
  
  return null;
}

/**
 * Определяет механику вопроса на основе текста и структуры
 */
export function detectMechanic(text: string): QuestionMechanic {
  // Сначала пытаемся извлечь из скобок
  const mechanicFromParentheses = extractMechanicFromParentheses(text);
  if (mechanicFromParentheses) {
    return mechanicFromParentheses;
  }
  
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
  // НО не для вопросов с "Утверждение" (это true-false-enhanced)
  // И не для вопросов с "Ситуация" или "Что выбрать" (это scenario или multiple-choice)
  if (
    !/утверждение/i.test(text) &&
    !/ситуация/i.test(text) &&
    !/что отличает|что лучше|что характерно/i.test(text) &&
    (/расстав|упорядоч|хронология|последовательность|в порядке|порядок/i.test(text) ||
    /от.*к|от причины к следствию/i.test(text))
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

  // УДАЛЕНО: grouping не используется в тестах
  // Grouping: "разнесите", "классифицируйте", "группы", "категории"
  // if (
  //   /разнес|классифицир|групп|категори|раздели.*на/i.test(text) ||
  //   /подходит.*не подходит/i.test(text)
  // ) {
  //   return "grouping";
  // }

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

  // True/False Enhanced: "верно/неверно" + причина или "Утверждение:" + True/False
  if (
    /верно.*неверно|верно.*не верно|true.*false/i.test(text) ||
    (/верно|неверно/i.test(text) && /причина|объяснение/i.test(text)) ||
    /утверждение.*верно|утверждение.*неверно/i.test(text) ||
    (/утверждение/i.test(text) && /true.*false|верно.*неверно/i.test(text))
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

  // УДАЛЕНО: best-example, scenario и construct не используются в тестах
  // Best example: "лучший пример", "лучшее перефразирование", "правильно применено"
  // if (
  //   /лучший пример|лучшее перефразирование|правильно применено|корректно применено/i.test(text) ||
  //   /лучший заголовок|правильный вывод/i.test(text)
  // ) {
  //   return "best-example";
  // }

  // Scenario: "ситуация", "кейс", "выберите шаги", "приоритеты"
  // Проверяем ПЕРЕД ordering, чтобы не перехватить вопросы с "расставьте"
  // if (
  //   /ситуация|кейс|сценарий|выберите.*шаг|приоритет/i.test(text) ||
  //   /проблема.*действие/i.test(text) ||
  //   (/ситуация/i.test(text) && /что выбрать|что сделать/i.test(text))
  // ) {
  //   return "scenario";
  // }

  // Construct: "соберите", "составьте из блоков", "выберите блоки"
  // if (
  //   /соберите|составьте из блоков|выберите блоки|собери.*из/i.test(text) ||
  //   /блок.*порядок/i.test(text)
  // ) {
  //   return "construct";
  // }

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
