import type { ParsedTest, ParsedQuestion } from "../parsers/baza-parser";
import type { PublicTestQuestion } from "@/tests/types";

/**
 * Генерирует TypeScript код для public.ts файла
 */
function generatePublicFile(test: ParsedTest): string {
  // Генерируем имя в формате CARBONIZATION_BASE_1_PUBLIC
  const testName = test.id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("_")
    .toUpperCase();

  const questionsCode = test.questions
    .map((q, idx) => {
      const questionId = `q${idx + 1}`;
      let questionCode = `    {\n      id: "${questionId}",\n      type: "${q.type}",\n`;

      // Обрабатываем разные типы вопросов
      if (q.type === "true-false-enhanced") {
        // TrueFalseEnhancedQuestion требует поле text (из BaseQuestion)
        questionCode += `      text: ${JSON.stringify(q.text || "")},\n`;
        questionCode += `      statement: ${JSON.stringify(q.text || "")},\n`;
        if (q.options && q.options.length > 0) {
          questionCode += `      reasons: ${JSON.stringify(q.options)},\n`;
        }
      } else if (q.type === "cloze-dropdown") {
        questionCode += `      text: ${JSON.stringify(q.text)},\n`;
        if (q.gaps && q.gaps.length > 0) {
          questionCode += `      gaps: ${JSON.stringify(q.gaps)},\n`;
        } else {
          questionCode += `      gaps: [],\n`;
        }
      } else if (q.type === "select-errors") {
        // SelectErrorsQuestion требует поле text (из BaseQuestion)
        questionCode += `      text: ${JSON.stringify(q.text || "")},\n`;
        questionCode += `      content: ${JSON.stringify(q.text || "")},\n`;
        if (q.markedParts && q.markedParts.length > 0) {
          questionCode += `      markedParts: ${JSON.stringify(q.markedParts)},\n`;
        } else {
          questionCode += `      markedParts: [],\n`;
        }
        questionCode += `      allowMultiple: true,\n`;
      } else if (q.type === "two-step") {
        // TwoStepQuestion требует поле text (из BaseQuestion)
        questionCode += `      text: ${JSON.stringify(q.text || "")},\n`;
        if (q.step1 && q.step2) {
          questionCode += `      step1: ${JSON.stringify(q.step1)},\n`;
          questionCode += `      step2: ${JSON.stringify(q.step2)},\n`;
        } else {
          // Генерируем по умолчанию, если step1/step2 не были распарсены
          const defaultStep1 = {
            question: q.text || "Выберите наиболее корректное утверждение",
            options: q.options || []
          };
          const defaultStep2 = {
            question: "Выберите объяснение",
            options: q.options || []
          };
          questionCode += `      step1: ${JSON.stringify(defaultStep1)},\n`;
          questionCode += `      step2: ${JSON.stringify(defaultStep2)},\n`;
        }
      } else if (q.type === "matrix") {
        // MatrixQuestion требует поле text (из BaseQuestion)
        questionCode += `      text: ${JSON.stringify(q.text || "")},\n`;
        if (q.rows && q.rows.length > 0) {
          questionCode += `      rows: ${JSON.stringify(q.rows)},\n`;
        } else {
          questionCode += `      rows: [],\n`;
        }
        if (q.columns && q.columns.length > 0) {
          questionCode += `      columns: ${JSON.stringify(q.columns)},\n`;
        } else {
          questionCode += `      columns: [],\n`;
        }
        questionCode += `      matrixType: ${q.matrixType ? JSON.stringify(q.matrixType) : '"single-select"'},\n`;
      } else if (q.type === "scenario") {
        // ScenarioQuestion требует поле text (из BaseQuestion)
        questionCode += `      text: ${JSON.stringify(q.text || "")},\n`;
        questionCode += `      situation: ${JSON.stringify(q.text || "")},\n`;
        questionCode += `      question: "Что нужно сделать?",\n`;
        questionCode += `      actionType: "select",\n`;
        if (q.options && q.options.length > 0) {
          questionCode += `      actions: ${JSON.stringify(q.options)},\n`;
        } else {
          questionCode += `      actions: [],\n`;
        }
      } else {
        // Обычные вопросы с text
        questionCode += `      text: ${JSON.stringify(q.text)},\n`;
        
        if (q.options && q.options.length > 0) {
          questionCode += `      options: ${JSON.stringify(q.options)},\n`;
        }

        if (q.leftItems && q.rightItems) {
          questionCode += `      leftItems: ${JSON.stringify(q.leftItems)},\n`;
          questionCode += `      rightItems: ${JSON.stringify(q.rightItems)},\n`;
          questionCode += `      variant: "1-to-1",\n`;
          questionCode += `      correctPairs: [],\n`;
        }

        if (q.items) {
          questionCode += `      items: ${JSON.stringify(q.items)},\n`;
          if (q.type === "ordering") {
            questionCode += `      correctOrder: [],\n`;
          }
        }

        if (q.categories) {
          questionCode += `      categories: ${JSON.stringify(q.categories)},\n`;
        }
      }

      if (q.hint) {
        questionCode += `      hint: ${JSON.stringify(q.hint)},\n`;
      }

      questionCode += `    }`;
      return questionCode;
    })
    .join(",\n");

  return `import type { PublicTest } from "../types";

export const ${testName}_PUBLIC: PublicTest = {
  id: "${test.id}",
  title: ${JSON.stringify(test.title)},
  description: ${JSON.stringify(`${test.level} • ${test.questions.length} вопросов`)},
  category: "коктейль",
  difficultyLevel: ${test.level.toLowerCase().includes("простой") || test.level.toLowerCase().includes("базов") ? 1 : test.level.toLowerCase().includes("сложный") || test.level.toLowerCase().includes("продвинут") ? 3 : 2},
  questions: [
${questionsCode}
  ],
};
`;
}

/**
 * Генерирует TypeScript код для answer.ts файла
 */
function generateAnswerFile(test: ParsedTest): string {
  // Генерируем имя в формате CARBONIZATION_BASE_1_SECRET
  const testName = test.id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("_")
    .toUpperCase();

  const answerKeyEntries = test.questions
    .map((q, idx) => {
      const questionId = `q${idx + 1}`;
      let answerValue: string;

      if (typeof q.correctAnswer === "number") {
        answerValue = q.correctAnswer.toString();
      } else if (Array.isArray(q.correctAnswer)) {
        answerValue = JSON.stringify(q.correctAnswer);
      } else if (typeof q.correctAnswer === "object") {
        answerValue = JSON.stringify(q.correctAnswer);
      } else {
        answerValue = "null";
      }

      return `    ${questionId}: ${answerValue},`;
    })
    .join("\n");

  return `import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const ${testName}_SECRET = {
  id: "${test.id}",
  basePoints: 200,
  difficulty: ${test.level.toLowerCase().includes("базов") ? 1.0 : test.level.toLowerCase().includes("продвинут") ? 3.0 : 2.0},
  maxAttempts: null as number | null,
  answerKey: {
${answerKeyEntries}
  } as Record<string, any>,
};
`;
}

/**
 * Конвертирует ParsedQuestion в PublicTestQuestion
 */
function convertParsedQuestionToPublic(
  parsed: ParsedQuestion,
  index: number
): PublicTestQuestion {
  const base = {
    id: parsed.id || `q${index + 1}`,
    text: parsed.text,
    type: parsed.type,
    hint: parsed.hint,
  };

  switch (parsed.type) {
    case "multiple-choice":
      return {
        ...base,
        type: "multiple-choice",
        options: parsed.options || [],
      };

    case "multiple-select":
      return {
        ...base,
        type: "multiple-select",
        options: parsed.options || [],
        instruction: "Выберите все верные ответы",
      };

    case "matching":
      return {
        ...base,
        type: "matching",
        leftItems: parsed.leftItems || [],
        rightItems: parsed.rightItems || [],
        correctPairs: [],
        variant: "1-to-1",
      };

    case "ordering":
      return {
        ...base,
        type: "ordering",
        items: parsed.items || [],
        correctOrder: [],
        instruction: "Расставьте в правильном порядке",
      };

    case "grouping":
      return {
        ...base,
        type: "grouping",
        items: parsed.items || [],
        categories: parsed.categories || [],
      };

    case "true-false-enhanced":
      return {
        ...base,
        type: "true-false-enhanced",
        statement: parsed.text,
        reasons: parsed.options || [],
      };

    case "cloze-dropdown":
      return {
        ...base,
        type: "cloze-dropdown",
        text: parsed.text,
        gaps: [],
      };

    case "select-errors":
      return {
        ...base,
        type: "select-errors",
        content: parsed.text,
        markedParts: [],
        allowMultiple: true,
      };

    case "two-step":
      return {
        ...base,
        type: "two-step",
        step1: {
          question: parsed.text,
          options: parsed.options || [],
        },
        step2: {
          question: "Выберите объяснение",
          options: parsed.options || [],
        },
      };

    case "matrix":
      return {
        ...base,
        type: "matrix",
        rows: [],
        columns: [],
        matrixType: "single-select",
      };

    case "best-example":
      return {
        ...base,
        type: "best-example",
        options: parsed.options || [],
      };

    case "scenario":
      return {
        ...base,
        type: "scenario",
        situation: parsed.text,
        question: "Что нужно сделать?",
        actionType: "select",
        actions: parsed.options || [],
      };

    case "construct":
      return {
        ...base,
        type: "construct",
        blocks: parsed.items || [],
        question: "both",
      };

    default:
      return {
        ...base,
        type: "multiple-choice",
        options: parsed.options || [],
      };
  }
}

/**
 * Генерирует файлы теста из распарсенных данных
 */
export function generateTestFiles(
  parsedTest: ParsedTest,
  outputDir: string
): { publicFile: string; answerFile: string } {
  const publicFile = generatePublicFile(parsedTest);
  const answerFile = generateAnswerFile(parsedTest);

  return {
    publicFile,
    answerFile,
  };
}

/**
 * Валидирует структуру распарсенного теста
 */
export function validateParsedTest(test: ParsedTest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!test.id || !test.title) {
    errors.push("Тест должен иметь id и title");
  }

  if (!test.questions || test.questions.length === 0) {
    errors.push("Тест должен содержать хотя бы один вопрос");
  }

  for (let i = 0; i < test.questions.length; i++) {
    const q = test.questions[i];
    if (!q.text) {
      errors.push(`Вопрос ${i + 1} не имеет текста`);
    }
    if (!q.type) {
      errors.push(`Вопрос ${i + 1} не имеет типа`);
    }
    // Предупреждение вместо ошибки для отсутствующих ответов
    if (q.correctAnswer === null || q.correctAnswer === undefined) {
      console.warn(`  ⚠ Вопрос ${i + 1} не имеет правильного ответа (будет установлен null)`);
      // Не добавляем как ошибку, чтобы тест все равно создался
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
