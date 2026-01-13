import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const TEST_1_SECRET = {
  id: "demo-logic-1",
  basePoints: 100,
  difficulty: 1.0,
  maxAttempts: null as number | null, // null = без ограничений, число = лимит попыток
  // correct option index (0-based)
  answerKey: {
    q1: 2, // 144
    q2: 2, // C(3) + D(4) = 7
    q3: 2, // 9 (не простое)
    q4: 2, // 13
    q5: 1, // x = 3
  } as Record<string, number>,
};
