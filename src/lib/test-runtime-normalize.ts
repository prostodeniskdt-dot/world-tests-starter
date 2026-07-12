import "server-only";
import {
  ensureRuntimeQuestionText,
  normalizeTestImport,
} from "@/lib/test-import/normalize";
import type { PublicTestQuestion } from "@/tests/types";

export type NormalizedTestContent = {
  questions: PublicTestQuestion[];
  answerKey: Record<string, unknown>;
};

/** Нормализация legacy-механик и answerKey при чтении из БД */
export function normalizeTestContentFromDb(
  questions: unknown,
  answerKey: unknown
): NormalizedTestContent {
  const { payload } = normalizeTestImport({
    questions: Array.isArray(questions) ? questions : [],
    answerKey:
      typeof answerKey === "object" && answerKey !== null
        ? (answerKey as Record<string, unknown>)
        : {},
  });

  return {
    questions: ((payload.questions ?? []) as Record<string, unknown>[]).map(
      ensureRuntimeQuestionText
    ) as unknown as PublicTestQuestion[],
    answerKey: (payload.answerKey ?? {}) as Record<string, unknown>,
  };
}
