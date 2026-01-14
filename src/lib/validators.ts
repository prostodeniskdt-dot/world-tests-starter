import { z } from "zod";

export const submitSchema = z.object({
  // userId больше не нужен в body, берется из JWT токена для безопасности
  testId: z.string().min(1).max(64),
  answers: z.record(z.string(), z.number().int().min(0).max(10).nullable()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});
