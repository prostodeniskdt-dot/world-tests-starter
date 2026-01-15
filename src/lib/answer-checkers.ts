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

/**
 * Проверяет пары соответствий
 */
function checkMatchingPairs(
  userPairs: [number, number][],
  correctPairs: [number, number][]
): boolean {
  if (userPairs.length !== correctPairs.length) return false;
  
  // Сортируем пары для сравнения
  const sortedUser = [...userPairs].sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });
  const sortedCorrect = [...correctPairs].sort((a, b) => {
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
 * Проверяет ответ для вопроса типа cloze-dropdown
 */
function checkClozeDropdown(
  userAnswer: number[],
  correctAnswer: number[]
): boolean {
  return arraysEqual(userAnswer, correctAnswer);
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
  userAnswer: number[] | [number, number][],
  correctAnswer: number[] | [number, number][],
  actionType: "select" | "order" | "match"
): boolean {
  if (actionType === "select" || actionType === "order") {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
    if (actionType === "order") {
      return arraysEqual(userAnswer as number[], correctAnswer as number[]);
    } else {
      return arraysEqualUnordered(userAnswer as number[], correctAnswer as number[]);
    }
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
      return checkClozeDropdown(userAnswer as number[], correctAnswer);

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
