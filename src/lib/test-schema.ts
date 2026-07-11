import { z } from "zod";

/** Поддерживаемые механики (канон) */
export const SUPPORTED_QUESTION_TYPES = [
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

export type SupportedQuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number];

export const LEGACY_QUESTION_TYPES = [
  "grouping",
  "best-example",
  "scenario",
  "construct",
] as const;

export const TEST_SCHEMA_VERSION = 1;
export const MAX_QUESTIONS = 100;
export const MAX_OPTIONS = 20;
export const MAX_STRING = 5000;

const mediaSchema = z
  .object({
    type: z.literal("image").optional(),
    url: z.string().url().max(2048),
    alt: z.string().max(300).optional(),
    caption: z.string().max(500).optional(),
  })
  .optional();

const baseQuestionFields = {
  id: z.string().min(1).max(64),
  text: z.string().max(MAX_STRING),
  hint: z.string().max(8000).optional(),
  imageUrl: z.string().max(2048).optional(),
  videoUrl: z.string().max(2048).optional(),
  media: mediaSchema,
};

export const multipleChoiceQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("multiple-choice"),
  options: z.array(z.string().max(500)).min(2).max(MAX_OPTIONS),
});

export const multipleSelectQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("multiple-select"),
  options: z.array(z.string().max(500)).min(2).max(MAX_OPTIONS),
  instruction: z.string().max(500).optional(),
});

export const trueFalseQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("true-false-enhanced"),
  statement: z.string().min(1).max(MAX_STRING),
  reasons: z.array(z.string().max(500)).max(MAX_OPTIONS).default([]),
});

export const clozeQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("cloze-dropdown"),
  gaps: z
    .array(
      z.object({
        index: z.number().int().min(0),
        options: z.array(z.string().max(500)).min(1).max(MAX_OPTIONS),
      })
    )
    .min(1)
    .max(MAX_OPTIONS),
  extraOptions: z.array(z.string()).optional(),
});

export const selectErrorsQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("select-errors"),
  content: z.string().min(1).max(MAX_STRING),
  markedParts: z
    .array(
      z.object({
        id: z.number().int().min(1),
        text: z.string().min(1).max(500),
        start: z.number().int().min(0).optional(),
        end: z.number().int().min(0).optional(),
      })
    )
    .min(1)
    .max(MAX_OPTIONS),
  allowMultiple: z.boolean().default(true),
});

export const matchingQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("matching"),
  leftItems: z.array(z.string().max(500)).min(1).max(MAX_OPTIONS),
  rightItems: z.array(z.string().max(500)).min(1).max(MAX_OPTIONS),
  variant: z.literal("1-to-1").optional(),
});

export const orderingQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("ordering"),
  items: z.array(z.string().max(500)).min(2).max(MAX_OPTIONS),
  instruction: z.string().max(500).optional(),
});

export const twoStepQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("two-step"),
  step1: z.object({
    question: z.string().max(MAX_STRING),
    options: z.array(z.string().max(500)).min(1).max(MAX_OPTIONS),
  }),
  step2: z.object({
    question: z.string().max(MAX_STRING),
    options: z.array(z.string().max(500)).min(1).max(MAX_OPTIONS),
  }),
});

export const matrixQuestionSchema = z.object({
  ...baseQuestionFields,
  type: z.literal("matrix"),
  rows: z.array(z.string().max(500)).min(1).max(MAX_OPTIONS),
  columns: z.array(z.string().max(500)).min(1).max(MAX_OPTIONS),
  matrixType: z.enum(["single-select", "multiple-select"]),
});

export const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceQuestionSchema,
  multipleSelectQuestionSchema,
  trueFalseQuestionSchema,
  clozeQuestionSchema,
  selectErrorsQuestionSchema,
  matchingQuestionSchema,
  orderingQuestionSchema,
  twoStepQuestionSchema,
  matrixQuestionSchema,
]);

export type TestQuestion = z.infer<typeof questionSchema>;

const answerKeyValueSchema = z.union([
  z.number().int().min(0),
  z.array(z.number().int().min(0)),
  z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])),
  z.record(z.string(), z.array(z.number().int().min(0))),
  z.object({ answer: z.boolean(), reason: z.number().int().min(0) }),
  z.object({
    step1: z.number().int().min(0),
    step2Mapping: z.record(z.string(), z.number().int().min(0)),
  }),
  z.record(z.string(), z.number().int().min(0)),
  z.record(z.string(), z.array(z.number().int().min(0))),
]);

export const testImportSchema = z.object({
  schemaVersion: z.number().int().min(1).max(1).optional().default(1),
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{2,63}$/)
    .optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  category: z.string().max(100).optional().default(""),
  author: z.string().max(120).optional().default(""),
  difficultyLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  basePoints: z.number().int().min(50).max(1000).optional().default(200),
  maxAttempts: z.number().int().min(1).nullable().optional().default(null),
  questions: z.array(questionSchema).min(1).max(MAX_QUESTIONS),
  answerKey: z.record(z.string(), answerKeyValueSchema),
});

export type TestImportPayload = z.infer<typeof testImportSchema>;

export type ValidationIssue = {
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
  hint?: string;
};

/** Семантическая проверка answerKey по типу вопроса */
export function validateAnswerKeyForQuestion(
  q: TestQuestion,
  answer: unknown
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const path = `answerKey.${q.id}`;

  if (answer === undefined || answer === null) {
    issues.push({ code: "MISSING_ANSWER", path, message: "Отсутствует ответ", severity: "error" });
    return issues;
  }

  switch (q.type) {
    case "multiple-choice": {
      if (typeof answer !== "number" || answer < 0 || answer >= q.options.length) {
        issues.push({
          code: "ANSWER_OUT_OF_RANGE",
          path,
          message: `Индекс ${answer} вне диапазона options (0..${q.options.length - 1})`,
          severity: "error",
        });
      }
      break;
    }
    case "multiple-select": {
      if (!Array.isArray(answer)) {
        issues.push({ code: "ANSWER_TYPE_MISMATCH", path, message: "Ожидается массив чисел", severity: "error" });
      } else {
        for (const idx of answer) {
          if (typeof idx !== "number" || idx < 0 || idx >= q.options.length) {
            issues.push({ code: "ANSWER_OUT_OF_RANGE", path, message: `Индекс ${idx} вне options`, severity: "error" });
          }
        }
      }
      break;
    }
    case "true-false-enhanced": {
      const a = answer as { answer?: boolean; reason?: number };
      if (typeof a?.answer !== "boolean") {
        issues.push({ code: "ANSWER_TYPE_MISMATCH", path, message: "Нужно { answer: boolean, reason: number }", severity: "error" });
      }
      if (q.reasons.length > 0 && (typeof a?.reason !== "number" || a.reason < 0 || a.reason >= q.reasons.length)) {
        issues.push({ code: "ANSWER_OUT_OF_RANGE", path, message: "reason вне диапазона reasons", severity: "error" });
      }
      break;
    }
    case "cloze-dropdown": {
      if (!Array.isArray(answer) || answer.length !== q.gaps.length) {
        issues.push({
          code: "CLOZE_GAP_MISMATCH",
          path,
          message: `Длина ответа ${Array.isArray(answer) ? answer.length : "?"} != gaps (${q.gaps.length})`,
          severity: "error",
        });
      } else {
        answer.forEach((idx, i) => {
          const opts = q.gaps[i]?.options ?? [];
          if (typeof idx !== "number" || idx < 0 || idx >= opts.length) {
            issues.push({ code: "ANSWER_OUT_OF_RANGE", path: `${path}[${i}]`, message: `Индекс ${idx} вне gap ${i}`, severity: "error" });
          }
        });
      }
      break;
    }
    case "select-errors": {
      if (!Array.isArray(answer)) {
        issues.push({ code: "ANSWER_TYPE_MISMATCH", path, message: "Ожидается массив id фрагментов", severity: "error" });
      } else {
        const validIds = new Set(q.markedParts.map((p) => p.id));
        for (const id of answer) {
          if (!validIds.has(id)) {
            issues.push({ code: "ANSWER_OUT_OF_RANGE", path, message: `Неизвестный id фрагмента ${id}`, severity: "error" });
          }
        }
      }
      break;
    }
    case "matching": {
      const pairs = normalizeMatchingAnswerArray(answer);
      if (!pairs || pairs.length !== q.leftItems.length) {
        issues.push({
          code: "MATCHING_INCOMPLETE",
          path,
          message: `Нужно ${q.leftItems.length} пар сопоставления`,
          severity: "error",
        });
      } else {
        for (const [l, r] of pairs) {
          if (l < 0 || l >= q.leftItems.length || r < 0 || r >= q.rightItems.length) {
            issues.push({ code: "ANSWER_OUT_OF_RANGE", path, message: `Пара [${l},${r}] вне диапазона`, severity: "error" });
          }
        }
      }
      break;
    }
    case "ordering": {
      if (!Array.isArray(answer) || answer.length !== q.items.length) {
        issues.push({ code: "ANSWER_TYPE_MISMATCH", path, message: "Нужен массив индексов длины items", severity: "error" });
      }
      break;
    }
    case "two-step": {
      const a = answer as { step1?: number; step2Mapping?: Record<string, number> };
      if (typeof a?.step1 !== "number" || a.step1 < 0 || a.step1 >= q.step1.options.length) {
        issues.push({ code: "ANSWER_OUT_OF_RANGE", path, message: "step1 вне диапазона", severity: "error" });
      }
      if (!a?.step2Mapping || typeof a.step2Mapping !== "object") {
        issues.push({ code: "ANSWER_TYPE_MISMATCH", path, message: "Нужен step2Mapping", severity: "error" });
      }
      break;
    }
    case "matrix": {
      if (typeof answer !== "object" || answer === null || Array.isArray(answer)) {
        issues.push({ code: "ANSWER_TYPE_MISMATCH", path, message: "Ожидается объект по строкам", severity: "error" });
      }
      break;
    }
  }

  return issues;
}

export function normalizeMatchingAnswerArray(answer: unknown): [number, number][] | null {
  if (!Array.isArray(answer)) return null;
  const pairs: [number, number][] = [];
  for (const p of answer) {
    if (!Array.isArray(p) || p.length !== 2) return null;
    const a = typeof p[0] === "number" ? p[0] : parseInt(String(p[0]), 10);
    const b = typeof p[1] === "number" ? p[1] : parseInt(String(p[1]), 10);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    pairs.push([a, b]);
  }
  return pairs;
}

export function validateTestPayload(data: unknown): {
  ok: boolean;
  data?: TestImportPayload;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const parsed = testImportSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        code: "SCHEMA_ERROR",
        path: issue.path.join(".") || "root",
        message: issue.message,
        severity: "error",
      });
    }
    return { ok: false, issues };
  }

  const payload = parsed.data;
  const ids = new Set<string>();
  for (const q of payload.questions) {
    if (ids.has(q.id)) {
      issues.push({ code: "DUPLICATE_QUESTION_ID", path: `questions.${q.id}`, message: `Дубликат id "${q.id}"`, severity: "error" });
    }
    ids.add(q.id);
    if (!(q.id in payload.answerKey)) {
      issues.push({ code: "MISSING_ANSWER_KEY", path: `answerKey.${q.id}`, message: "Нет ключа ответа", severity: "error" });
    } else {
      issues.push(...validateAnswerKeyForQuestion(q, payload.answerKey[q.id]));
    }
  }

  for (const key of Object.keys(payload.answerKey)) {
    if (!ids.has(key)) {
      issues.push({ code: "ORPHAN_ANSWER_KEY", path: `answerKey.${key}`, message: "Ключ без вопроса", severity: "warning" });
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  return { ok: errors.length === 0, data: payload, issues };
}
