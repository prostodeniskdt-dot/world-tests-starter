import "server-only";
import { normalizeTestImport } from "@/lib/test-import/normalize";
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
    questions: (payload.questions ?? []) as PublicTestQuestion[],
    answerKey: (payload.answerKey ?? {}) as Record<string, unknown>,
  };
}
