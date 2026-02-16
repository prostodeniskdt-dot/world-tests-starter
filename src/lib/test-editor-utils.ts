/**
 * Утилиты для редактора тестов: типы вопросов, нормализация, значения по умолчанию, валидация.
 */

// Только типы с полной поддержкой: рендерер в QuestionRenderer + checker в answer-checkers
export const QUESTION_TYPES = [
  "multiple-choice",
  "multiple-select",
  "true-false-enhanced",
  "cloze-dropdown",
  "select-errors",
  "matching",
  "ordering",
  "two-step",
  "matrix",
] as const;

export type QuestionTypeEditor = (typeof QUESTION_TYPES)[number];

// Английские названия типов по механикам (как в types.ts)
export const QUESTION_TYPE_LABELS: Record<string, string> = {
  "multiple-choice": "multiple-choice",
  "multiple-select": "multiple-select",
  "true-false-enhanced": "true-false-enhanced",
  "cloze-dropdown": "cloze-dropdown",
  "select-errors": "select-errors",
  "matching": "matching",
  "ordering": "ordering",
  "two-step": "two-step",
  "matrix": "matrix",
};

export function defaultAnswerForType(type: string, question?: any): any {
  switch (type) {
    case "multiple-choice":
      return 0;
    case "multiple-select":
      return [];
    case "true-false-enhanced":
      return { answer: true, reason: 0 };
    case "cloze-dropdown":
      const gapCount = question?.gaps?.length ?? 1;
      return Array.from({ length: gapCount }, () => 0);
    case "matching":
      return [];
    case "ordering":
      return [];
    case "select-errors":
      return [];
    case "two-step":
      return { step1: 0, step2Mapping: { 0: 0 } };
    case "matrix":
      return {};
    case "grouping":
      return {};
    default:
      return 0;
  }
}

export function normalizeQuestionByType(question: any, newType: string): any {
  const base = {
    id: question.id,
    text: question.text ?? "",
    hint: question.hint ?? "",
  };

  switch (newType) {
    case "multiple-choice":
      return { ...base, type: "multiple-choice", options: question.options ?? ["", ""] };
    case "multiple-select":
      return { ...base, type: "multiple-select", options: question.options ?? ["", ""] };
    case "true-false-enhanced":
      return {
        ...base,
        type: "true-false-enhanced",
        statement: question.statement ?? question.text ?? "",
        reasons: question.reasons?.length ? question.reasons : [],
      };
    case "cloze-dropdown":
      return {
        ...base,
        type: "cloze-dropdown",
        text: question.text || "Вставьте пропуски: [1], [2] и т.д.",
        gaps: question.gaps?.length
          ? question.gaps
          : [{ index: 0, options: [""] }],
      };
    case "matching":
      return {
        ...base,
        type: "matching",
        leftItems: question.leftItems ?? [],
        rightItems: question.rightItems ?? [],
      };
    case "ordering":
      return {
        ...base,
        type: "ordering",
        items: question.items ?? [],
      };
    case "select-errors":
      return {
        ...base,
        type: "select-errors",
        content: question.content ?? question.text ?? "",
        markedParts: question.markedParts ?? [],
        allowMultiple: question.allowMultiple ?? true,
      };
    case "two-step":
      return {
        ...base,
        type: "two-step",
        step1: question.step1 ?? { question: "", options: [""] },
        step2: question.step2 ?? { question: "", options: [""] },
      };
    case "matrix":
      return {
        ...base,
        type: "matrix",
        rows: question.rows ?? [],
        columns: question.columns ?? [],
        matrixType: question.matrixType ?? "single-select",
      };
    case "grouping":
      return {
        ...base,
        type: "grouping",
        items: question.items ?? [],
        categories: question.categories ?? [],
      };
    default:
      return { ...base, type: "multiple-choice", options: ["", ""] };
  }
}

export function createDefaultQuestion(existingIds: Set<string>): { id: string; question: any } {
  let id = `q${Date.now()}`;
  while (existingIds.has(id)) {
    id = `q${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }
  const question = normalizeQuestionByType(
    { id, text: "", hint: "" },
    "multiple-choice"
  );
  return { id, question };
}

export type ValidationError = { field: string; message: string };

export function validateTestForSave(test: {
  title?: string;
  questions: any[];
  answerKey: Record<string, any>;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!test.title || typeof test.title !== "string" || !test.title.trim()) {
    errors.push({ field: "title", message: "Укажите название теста" });
  }

  if (!test.questions || !Array.isArray(test.questions)) {
    errors.push({ field: "questions", message: "Вопросы должны быть массивом" });
    return errors;
  }

  const answerKey = test.answerKey && typeof test.answerKey === "object" && !Array.isArray(test.answerKey)
    ? test.answerKey
    : {};

  test.questions.forEach((q: any, i: number) => {
    if (!q.id) errors.push({ field: `questions[${i}].id`, message: `Вопрос ${i + 1}: укажите ID` });
    if (!q.type) errors.push({ field: `questions[${i}].type`, message: `Вопрос ${i + 1}: укажите тип` });
    if (q.type === "true-false-enhanced") {
      if (!(q.statement && String(q.statement).trim())) {
        errors.push({ field: `questions[${i}].statement`, message: `Вопрос ${i + 1}: укажите утверждение` });
      }
    } else if (q.type === "select-errors") {
      const c = q.content ?? q.text ?? "";
      if (!c.trim()) {
        errors.push({ field: `questions[${i}].content`, message: `Вопрос ${i + 1}: укажите утверждение (content)` });
      }
      if (!q.markedParts?.length) {
        errors.push({ field: `questions[${i}].markedParts`, message: `Вопрос ${i + 1}: добавьте фрагменты для выбора` });
      }
    } else if (q.text === undefined || q.text === null || String(q.text).trim() === "") {
      errors.push({ field: `questions[${i}].text`, message: `Вопрос ${i + 1}: укажите текст` });
    }
    if (q.id && !(q.id in answerKey)) {
      errors.push({ field: `answerKey.${q.id}`, message: `Вопрос "${q.id}": укажите правильный ответ` });
    }
    if (q.type === "multiple-choice" && (!q.options || q.options.length === 0)) {
      errors.push({ field: `questions[${i}].options`, message: `Вопрос ${i + 1}: добавьте варианты ответа` });
    }
    if (q.type === "multiple-select" && (!q.options || q.options.length === 0)) {
      errors.push({ field: `questions[${i}].options`, message: `Вопрос ${i + 1}: добавьте варианты ответа` });
    }
    // true-false-enhanced: reasons опциональны (простой режим — только Верно/Неверно + подсказка)
    if (q.type === "cloze-dropdown" && (!q.gaps || q.gaps.length === 0)) {
      errors.push({ field: `questions[${i}].gaps`, message: `Вопрос ${i + 1}: добавьте хотя бы один пропуск` });
    }
    if (q.type === "matching" && (!q.leftItems?.length && !q.rightItems?.length)) {
      errors.push({ field: `questions[${i}]`, message: `Вопрос ${i + 1}: укажите левый и правый столбцы` });
    }
    if (q.type === "ordering" && (!q.items || q.items.length === 0)) {
      errors.push({ field: `questions[${i}].items`, message: `Вопрос ${i + 1}: добавьте элементы для упорядочивания` });
    }
  });

  return errors;
}
