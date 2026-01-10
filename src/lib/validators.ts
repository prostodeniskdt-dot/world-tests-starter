import { z } from "zod";

export const submitSchema = z.object({
  userId: z.string().uuid(),
  username: z.string().trim().min(2).max(24),
  testId: z.string().min(1).max(64),
  answers: z.record(z.string(), z.number().int().min(0).max(10).nullable()),
});

export const telegramAuthSchema = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.string(),
  hash: z.string(),
});
