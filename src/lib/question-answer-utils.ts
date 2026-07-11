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
      return typeof answer === "number" && answer >= 0;

    case "multiple-select":
      return Array.isArray(answer) && answer.length > 0;

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
      return (answer as number[]).every((idx) => typeof idx === "number" && idx >= 0);
    }

    case "select-errors": {
      if (!Array.isArray(answer)) return false;
      if (question.allowMultiple === false) return answer.length === 1;
      return answer.length > 0;
    }

    case "matching": {
      if (!Array.isArray(answer)) return false;
      const leftCount = question.leftItems?.length ?? 0;
      if (answer.length !== leftCount) return false;
      return (answer as [number, number][]).every(
        (p) =>
          Array.isArray(p) &&
          p.length === 2 &&
          typeof p[0] === "number" &&
          typeof p[1] === "number" &&
          p[1] >= 0
      );
    }

    case "ordering": {
      if (!Array.isArray(answer)) return false;
      const n = question.items?.length ?? 0;
      return answer.length === n && (answer as number[]).every((x) => x >= 0);
    }

    case "two-step": {
      const a = answer as { step1?: number; step2?: number };
      return (
        typeof a.step1 === "number" &&
        a.step1 >= 0 &&
        typeof a.step2 === "number" &&
        a.step2 >= 0
      );
    }

    case "matrix": {
      if (typeof answer !== "object" || answer === null || Array.isArray(answer)) return false;
      const rows = question.rows ?? [];
      const obj = answer as Record<number, number | number[]>;
      if (question.matrixType === "single-select") {
        return rows.every((_, i) => typeof obj[i] === "number" && (obj[i] as number) >= 0);
      }
      return rows.every((_, i) => Array.isArray(obj[i]) && (obj[i] as number[]).length > 0);
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
