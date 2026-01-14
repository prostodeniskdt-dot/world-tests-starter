import { z } from "zod";

export const submitSchema = z.object({
  userId: z.string().uuid(),
  testId: z.string().min(1).max(64),
  answers: z.record(z.string(), z.union([z.number().int().min(0).max(10), z.string()]).nullable()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});
