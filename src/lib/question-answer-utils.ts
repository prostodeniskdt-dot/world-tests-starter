import type { PublicTestQuestion, QuestionAnswer } from "@/tests/types";

/** Проверяет, заполнен ли ответ пользователя для конкретного типа вопроса */
export function isAnswerComplete(
  question: PublicTestQuestion,
  answer: QuestionAnswer | null | undefined
): boolean {
  if (answer === null || answer === undefined) return false;

  switch (question.type) {
    case "multiple-choice":
    case "best-example":
      return (
        typeof answer === "number" &&
        Number.isInteger(answer) &&
        answer >= 0 &&
        answer < question.options.length
      );

    case "multiple-select": {
      if (!Array.isArray(answer) || answer.length === 0) return false;
      const values = answer as number[];
      return (
        new Set(values).size === values.length &&
        values.every(
          (idx) =>
            typeof idx === "number" &&
            Number.isInteger(idx) &&
            idx >= 0 &&
            idx < question.options.length
        )
      );
    }

    case "true-false-enhanced": {
      const a = answer as { answer?: boolean | null; reason?: number | null };
      if (a.answer !== true && a.answer !== false) return false;
      const reasons = question.reasons ?? [];
      if (reasons.length <= 1) return true;
      return typeof a.reason === "number" && a.reason >= 0 && a.reason < reasons.length;
    }

    case "cloze-dropdown": {
      if (!Array.isArray(answer)) return false;
      const gaps = question.gaps ?? [];
      if (answer.length !== gaps.length) return false;
      const extraOptions = question.extraOptions ?? [];
      return (answer as number[]).every(
        (idx, gapIndex) => {
          const gapOptions = gaps[gapIndex]?.options ?? [];
          const optionsCount =
            gapOptions.length + extraOptions.filter((option) => !gapOptions.includes(option)).length;
          return (
            typeof idx === "number" &&
            Number.isInteger(idx) &&
            idx >= 0 &&
            idx < optionsCount
          );
        }
      );
    }

    case "select-errors": {
      if (!Array.isArray(answer)) return false;
      const values = answer as number[];
      const validIds = new Set(question.markedParts.map((part) => part.id));
      if (new Set(values).size !== values.length) return false;
      if (!values.every((id) => validIds.has(id))) return false;
      if (question.allowMultiple === false) return values.length === 1;
      return values.length > 0;
    }

    case "matching": {
      if (!Array.isArray(answer)) return false;
      const leftCount = question.leftItems?.length ?? 0;
      if (answer.length !== leftCount) return false;
      const pairs = answer as [number, number][];
      const validPairs = pairs.every(
        (p) =>
          Array.isArray(p) &&
          p.length === 2 &&
          typeof p[0] === "number" &&
          Number.isInteger(p[0]) &&
          p[0] >= 0 &&
          p[0] < leftCount &&
          typeof p[1] === "number" &&
          Number.isInteger(p[1]) &&
          p[1] >= 0 &&
          p[1] < question.rightItems.length
      );
      if (!validPairs) return false;
      if (new Set(pairs.map(([left]) => left)).size !== leftCount) return false;
      if (
        question.variant === "1-to-1" &&
        new Set(pairs.map(([, right]) => right)).size !== pairs.length
      ) {
        return false;
      }
      return true;
    }

    case "ordering": {
      if (!Array.isArray(answer)) return false;
      const n = question.items?.length ?? 0;
      const values = answer as number[];
      return (
        values.length === n &&
        new Set(values).size === n &&
        values.every((idx) => Number.isInteger(idx) && idx >= 0 && idx < n)
      );
    }

    case "two-step": {
      const a = answer as { step1?: number; step2?: number };
      return (
        typeof a.step1 === "number" &&
        Number.isInteger(a.step1) &&
        a.step1 >= 0 &&
        a.step1 < question.step1.options.length &&
        typeof a.step2 === "number" &&
        Number.isInteger(a.step2) &&
        a.step2 >= 0 &&
        a.step2 < question.step2.options.length
      );
    }

    case "matrix": {
      if (typeof answer !== "object" || answer === null || Array.isArray(answer)) return false;
      const rows = question.rows ?? [];
      const obj = answer as Record<number, number | number[]>;
      const keys = Object.keys(obj).map(Number);
      if (
        keys.length !== rows.length ||
        new Set(keys).size !== rows.length ||
        !keys.every((key) => Number.isInteger(key) && key >= 0 && key < rows.length)
      ) {
        return false;
      }
      if (question.matrixType === "single-select") {
        return rows.every(
          (_, i) =>
            typeof obj[i] === "number" &&
            Number.isInteger(obj[i] as number) &&
            (obj[i] as number) >= 0 &&
            (obj[i] as number) < question.columns.length
        );
      }
      return rows.every((_, i) => {
        if (!Array.isArray(obj[i]) || (obj[i] as number[]).length === 0) return false;
        const values = obj[i] as number[];
        return (
          new Set(values).size === values.length &&
          values.every(
            (idx) => Number.isInteger(idx) && idx >= 0 && idx < question.columns.length
          )
        );
      });
    }

    case "grouping":
    case "scenario":
    case "construct":
      return typeof answer === "object" && answer !== null && Object.keys(answer).length > 0;

    default:
      return false;
  }
}

export function countAnsweredQuestions(
  questions: PublicTestQuestion[],
  answers: Record<string, QuestionAnswer | null>
): number {
  return questions.filter((q) => isAnswerComplete(q, answers[q.id])).length;
}

export function allQuestionsAnswered(
  questions: PublicTestQuestion[],
  answers: Record<string, QuestionAnswer | null>
): boolean {
  return questions.every((q) => isAnswerComplete(q, answers[q.id]));
}

const DRAFT_PREFIX = "test_draft_";

export function getDraftStorageKey(testId: string): string {
  return `${DRAFT_PREFIX}${testId}`;
}

export type TestDraft = {
  version: number;
  savedAt: string;
  answers: Record<string, QuestionAnswer | null>;
};

export function saveTestDraft(testId: string, version: number, answers: Record<string, QuestionAnswer | null>): void {
  try {
    const draft: TestDraft = {
      version,
      savedAt: new Date().toISOString(),
      answers,
    };
    localStorage.setItem(getDraftStorageKey(testId), JSON.stringify(draft));
  } catch {
    /* private mode */
  }
}

export function loadTestDraft(testId: string, version: number): Record<string, QuestionAnswer | null> | null {
  try {
    const raw = localStorage.getItem(getDraftStorageKey(testId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as TestDraft;
    if (draft.version !== version) return null;
    return draft.answers ?? null;
  } catch {
    return null;
  }
}

export function clearTestDraft(testId: string): void {
  try {
    localStorage.removeItem(getDraftStorageKey(testId));
  } catch {
    /* ignore */
  }
}
