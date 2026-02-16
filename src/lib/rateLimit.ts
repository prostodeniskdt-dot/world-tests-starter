import { RateLimiterMemory } from "rate-limiter-flexible";

// Создаем разные лимитеры для разных эндпоинтов
export const loginRateLimiter = new RateLimiterMemory({
  points: 5, // Количество запросов
  duration: 60, // За период (в секундах)
});

export const submitRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

// Лимит по пользователю: не более 10 отправок в минуту на одного user_id
export const submitRateLimiterByUser = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

export const registerRateLimiter = new RateLimiterMemory({
  points: 3,
  duration: 3600, // 1 час
});

export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<{ allowed: boolean; remaining?: number; resetTime?: Date }> {
  try {
    const result = await limiter.consume(key);
    return {
      allowed: true,
      remaining: result.remainingPoints,
      resetTime: result.msBeforeNext
        ? new Date(Date.now() + result.msBeforeNext)
        : undefined,
    };
  } catch (result: any) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: result.msBeforeNext
        ? new Date(Date.now() + result.msBeforeNext)
        : undefined,
    };
  }
}
