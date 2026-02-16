import type { PublicTestQuestion, QuestionAnswer } from "@/tests/types";

/**
 * Сравнивает два массива на равенство (порядок важен)
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Сравнивает два массива на равенство (порядок не важен)
 */
function arraysEqualUnordered<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return arraysEqual(sortedA, sortedB);
}

/** Нормализует пару: приводит элементы к number (на случай строк из JSON) */
function normalizePair(p: unknown): [number, number] | null {
  if (!Array.isArray(p) || p.length !== 2) return null;
  const a = typeof p[0] === "number" ? p[0] : parseInt(String(p[0]), 10);
  const b = typeof p[1] === "number" ? p[1] : parseInt(String(p[1]), 10);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return [a, b];
}

/**
 * Нормализует ключ matching: принимает массив пар [[0,0],[1,2],[2,1]]
 * или объект { "0": 0, "1": 2, "2": 1 }, или 1-based пары [[1,1],[2,3],[3,2]].
 * Приводит всё к 0-based.
 */
function normalizeMatchingKey(correctAnswer: unknown): [number, number][] | null {
  let pairs: [number, number][] | null = null;

  if (Array.isArray(correctAnswer)) {
    const parsed = correctAnswer.map(normalizePair).filter((x): x is [number, number] => x !== null);
    if (parsed.length !== correctAnswer.length) return null;
    pairs = parsed;
  } else if (correctAnswer !== null && typeof correctAnswer === "object" && !Array.isArray(correctAnswer)) {
    const obj = correctAnswer as Record<string, unknown>;
    const keys = Object.keys(obj).map((k) => parseInt(k, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
    pairs = [];
    for (const left of keys) {
      const right = obj[String(left)];
      const r = typeof right === "number" ? right : parseInt(String(right), 10);
      if (Number.isNaN(r)) return null;
      pairs.push([left, r]);
    }
    if (pairs.length === 0) return null;
  } else {
    return null;
  }

  if (!pairs || pairs.length === 0) return null;

  // Ключ мог быть сохранён в 1-based формате (1–A, 2–C, 3–B → [1,1],[2,3],[3,2])
  const minLeft = Math.min(...pairs.map((p) => p[0]));
  const minRight = Math.min(...pairs.map((p) => p[1]));
  if (minLeft > 0 || minRight > 0) {
    pairs = pairs.map(([a, b]) => [a - (minLeft > 0 ? 1 : 0), b - (minRight > 0 ? 1 : 0)]);
  }
  return pairs;
}

/**
 * Проверяет пары соответствий
 */
function checkMatchingPairs(
  userPairs: [number, number][],
  correctPairs: unknown
): boolean {
  const normalizedCorrect = normalizeMatchingKey(correctPairs);
  if (normalizedCorrect === null) return false;
  if (userPairs.length !== normalizedCorrect.length) return false;

  const normalizedUser = userPairs.map((p) => normalizePair(p)).filter((x): x is [number, number] => x !== null);
  if (normalizedUser.length !== userPairs.length) return false;

  const sortedUser = [...normalizedUser].sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });
  const sortedCorrect = [...normalizedCorrect].sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });

  return arraysEqual(sortedUser, sortedCorrect);
}

/**
 * Проверяет ответ для вопроса типа multiple-choice
 */
function checkMultipleChoice(
  userAnswer: number,
  correctAnswer: number
): boolean {
  return userAnswer === correctAnswer;
}

/**
 * Проверяет ответ для вопроса типа multiple-select
 */
function checkMultipleSelect(
  userAnswer: number[],
  correctAnswer: number[]
): boolean {
  return arraysEqualUnordered(userAnswer, correctAnswer);
}

/**
 * Проверяет ответ для вопроса типа matching
 */
function checkMatching(
  userAnswer: [number, number][],
  correctAnswer: [number, number][]
): boolean {
  return checkMatchingPairs(userAnswer, correctAnswer);
}

/**
 * Проверяет ответ для вопроса типа ordering
 */
function checkOrdering(
  userAnswer: number[],
  correctAnswer: number[]
): boolean {
  return arraysEqual(userAnswer, correctAnswer);
}

/**
 * Проверяет ответ для вопроса типа grouping
 */
function checkGrouping(
  userAnswer: Record<string, number[]>,
  correctAnswer: Record<string, number[]>
): boolean {
  const userKeys = Object.keys(userAnswer).sort();
  const correctKeys = Object.keys(correctAnswer).sort();
  
  if (!arraysEqual(userKeys, correctKeys)) return false;
  
  for (const key of userKeys) {
    if (!arraysEqualUnordered(userAnswer[key], correctAnswer[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Проверяет ответ для вопроса типа true-false-enhanced
 */
function checkTrueFalseEnhanced(
  userAnswer: { answer: boolean; reason: number },
  correctAnswer: { answer: boolean; reason: number }
): boolean {
  return (
    userAnswer.answer === correctAnswer.answer &&
    userAnswer.reason === correctAnswer.reason
  );
}

/**
 * Проверяет ответ для вопроса типа cloze-dropdown.
 * Сравнивает по индексам; при расхождении — по тексту выбранной опции (на случай дубликатов или синонимов).
 */
function checkClozeDropdown(
  userAnswer: number[],
  correctAnswer: unknown,
  question?: { gaps?: Array<{ options?: string[] }> }
): boolean {
  if (!Array.isArray(correctAnswer) || userAnswer.length !== correctAnswer.length) return false;

  const correct = correctAnswer as number[];
  for (let i = 0; i < userAnswer.length; i++) {
    if (userAnswer[i] === correct[i]) continue;
    const gap = question?.gaps?.[i];
    const opts = gap?.options || [];
    const userText = (opts[userAnswer[i]] ?? "").trim().toLowerCase();
    const correctText = (opts[correct[i]] ?? "").trim().toLowerCase();
    if (userText && correctText && (userText === correctText || correctText.startsWith(userText) || userText.startsWith(correctText))) continue;
    return false;
  }
  return true;
}

/**
 * Проверяет ответ для вопроса типа select-errors
 */
function checkSelectErrors(
  userAnswer: number[],
  correctAnswer: number[]
): boolean {
  return arraysEqualUnordered(userAnswer, correctAnswer);
}

/**
 * Проверяет ответ для вопроса типа two-step
 */
function checkTwoStep(
  userAnswer: { step1: number; step2: number },
  correctAnswer: { step1: number; step2Mapping: Record<number, number> }
): boolean {
  if (userAnswer.step1 !== correctAnswer.step1) return false;
  const correctStep2 = correctAnswer.step2Mapping[userAnswer.step1];
  return userAnswer.step2 === correctStep2;
}

/**
 * Проверяет ответ для вопроса типа matrix (single-select)
 */
function checkMatrixSingle(
  userAnswer: Record<number, number>,
  correctAnswer: Record<number, number>
): boolean {
  const userKeys = Object.keys(userAnswer).map(Number).sort();
  const correctKeys = Object.keys(correctAnswer).map(Number).sort();
  
  if (!arraysEqual(userKeys, correctKeys)) return false;
  
  for (const key of userKeys) {
    if (userAnswer[key] !== correctAnswer[key]) return false;
  }
  
  return true;
}

/**
 * Проверяет ответ для вопроса типа matrix (multiple-select)
 */
function checkMatrixMultiple(
  userAnswer: Record<number, number[]>,
  correctAnswer: Record<number, number[]>
): boolean {
  return checkGrouping(userAnswer, correctAnswer);
}

/**
 * Проверяет ответ для вопроса типа best-example
 */
function checkBestExample(
  userAnswer: number,
  correctAnswer: number
): boolean {
  return userAnswer === correctAnswer;
}

/**
 * Проверяет ответ для вопроса типа scenario
 */
function checkScenario(
  userAnswer: number | number[] | [number, number][],
  correctAnswer: number | number[] | [number, number][],
  actionType: "select" | "order" | "match"
): boolean {
  if (actionType === "select") {
    // Для select используется один выбор (как multiple-choice)
    return checkMultipleChoice(userAnswer as number, correctAnswer as number);
  } else if (actionType === "order") {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
    return arraysEqual(userAnswer as number[], correctAnswer as number[]);
  } else {
    // match
    return checkMatchingPairs(
      userAnswer as [number, number][],
      correctAnswer as [number, number][]
    );
  }
}

/**
 * Проверяет ответ для вопроса типа construct
 */
function checkConstruct(
  userAnswer: { blocks: number[]; order: number[] },
  correctAnswer: { blocks: number[]; order: number[] }
): boolean {
  const blocksMatch = arraysEqualUnordered(userAnswer.blocks, correctAnswer.blocks);
  const orderMatch = arraysEqual(userAnswer.order, correctAnswer.order);
  return blocksMatch && orderMatch;
}

/**
 * Главная функция проверки ответа
 */
export function checkAnswer(
  question: PublicTestQuestion,
  userAnswer: QuestionAnswer | null,
  correctAnswer: any
): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;

  switch (question.type) {
    case "multiple-choice":
      return checkMultipleChoice(userAnswer as number, correctAnswer);

    case "multiple-select":
      return checkMultipleSelect(userAnswer as number[], correctAnswer);

    case "matching":
      return checkMatching(userAnswer as [number, number][], correctAnswer);

    case "ordering":
      return checkOrdering(userAnswer as number[], correctAnswer);

    case "grouping":
      return checkGrouping(
        userAnswer as Record<string, number[]>,
        correctAnswer
      );

    case "true-false-enhanced":
      return checkTrueFalseEnhanced(
        userAnswer as { answer: boolean; reason: number },
        correctAnswer
      );

    case "cloze-dropdown":
      return checkClozeDropdown(userAnswer as number[], correctAnswer, question);

    case "select-errors":
      return checkSelectErrors(userAnswer as number[], correctAnswer);

    case "two-step":
      return checkTwoStep(
        userAnswer as { step1: number; step2: number },
        correctAnswer
      );

    case "matrix":
      if (question.matrixType === "single-select") {
        return checkMatrixSingle(
          userAnswer as Record<number, number>,
          correctAnswer
        );
      } else {
        return checkMatrixMultiple(
          userAnswer as Record<number, number[]>,
          correctAnswer
        );
      }

    case "best-example":
      return checkBestExample(userAnswer as number, correctAnswer);

    case "scenario":
      return checkScenario(
        userAnswer as number[] | [number, number][],
        correctAnswer,
        question.actionType
      );

    case "construct":
      return checkConstruct(
        userAnswer as { blocks: number[]; order: number[] },
        correctAnswer
      );

    default:
      return false;
  }
}

// Экспорт вспомогательных функций для тестирования
export {
  arraysEqual,
  arraysEqualUnordered,
  checkMatchingPairs,
  checkMultipleChoice,
  checkMultipleSelect,
  checkMatching,
  checkOrdering,
  checkGrouping,
  checkTrueFalseEnhanced,
  checkClozeDropdown,
  checkSelectErrors,
  checkTwoStep,
  checkMatrixSingle,
  checkMatrixMultiple,
  checkBestExample,
  checkScenario,
  checkConstruct,
};
