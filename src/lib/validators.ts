import { z } from "zod";

// Схема для ответа типа number (multiple-choice, best-example)
const numberAnswerSchema = z.number().int().min(0);

// Схема для ответа типа number[] (multiple-select, ordering, cloze-dropdown, select-errors)
const numberArrayAnswerSchema = z.array(z.number().int().min(0));

// Схема для ответа типа [number, number][] (matching)
const matchingPairSchema = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
const matchingAnswerSchema = z.array(matchingPairSchema);

// Схема для ответа типа Record<string, number[]> (grouping)
const groupingAnswerSchema = z.record(z.string(), z.array(z.number().int().min(0)));

// Схема для ответа типа { answer: boolean; reason: number } (true-false-enhanced)
const trueFalseAnswerSchema = z.object({
  answer: z.boolean(),
  reason: z.number().int().min(0),
});

// Схема для ответа типа { step1: number; step2: number } (two-step)
const twoStepAnswerSchema = z.object({
  step1: z.number().int().min(0),
  step2: z.number().int().min(0),
});

// Схема для ответа типа Record<number, number> (matrix single-select)
const matrixSingleAnswerSchema = z.record(
  z.string().transform(Number),
  z.number().int().min(0)
);

// Схема для ответа типа Record<number, number[]> (matrix multiple-select)
const matrixMultipleAnswerSchema = z.record(
  z.string().transform(Number),
  z.array(z.number().int().min(0))
);

// Схема для ответа типа { blocks: number[]; order: number[] } (construct)
const constructAnswerSchema = z.object({
  blocks: z.array(z.number().int().min(0)),
  order: z.array(z.number().int().min(0)),
});

// Union всех возможных форматов ответов
export const questionAnswerSchema = z.union([
  numberAnswerSchema,
  numberArrayAnswerSchema,
  matchingAnswerSchema,
  groupingAnswerSchema,
  trueFalseAnswerSchema,
  twoStepAnswerSchema,
  matrixSingleAnswerSchema,
  matrixMultipleAnswerSchema,
  constructAnswerSchema,
  z.null(),
]);

export const submitSchema = z.object({
  // userId больше не нужен в body, берется из JWT токена для безопасности
  testId: z.string().min(1).max(64),
  answers: z.record(z.string(), questionAnswerSchema),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  // Ключ идемпотентности: повторная отправка с тем же ключом не создаёт новую попытку
  idempotencyKey: z.string().uuid().optional(),
});
