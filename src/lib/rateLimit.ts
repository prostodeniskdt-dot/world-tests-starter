import { RateLimiterMemory } from "rate-limiter-flexible";

export const loginRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
});

export const submitRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

export const submitRateLimiterByUser = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

export const registerRateLimiter = new RateLimiterMemory({
  points: 3,
  duration: 3600,
});

export const checkEmailRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 900,
});

export const forgotPasswordRateLimiter = new RateLimiterMemory({
  points: 3,
  duration: 900,
});

export const forgotPasswordByEmailRateLimiter = new RateLimiterMemory({
  points: 3,
  duration: 900,
});

export const resetPasswordRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
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
  } catch (result: unknown) {
    const msBeforeNext =
      result && typeof result === "object" && "msBeforeNext" in result
        ? Number((result as { msBeforeNext?: number }).msBeforeNext)
        : undefined;
    return {
      allowed: false,
      remaining: 0,
      resetTime: msBeforeNext ? new Date(Date.now() + msBeforeNext) : undefined,
    };
  }
}
