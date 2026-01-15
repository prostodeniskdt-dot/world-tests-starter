import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const COCKTAIL_BASE_1_SECRET = {
  id: "cocktail-base-1",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 0,
    q2: null,
    q3: [1,3,0,2],
    q4: null,
    q5: null,
    q6: 0,
    q7: null,
    q8: 0,
    q9: 0,
    q10: [1,4],
    q11: 0,
    q12: 0,
    q13: null,
    q14: 0,
    q15: [2,1,3,0],
    q16: 0,
    q17: 0,
    q18: 0,
    q19: 0,
    q20: 0,
  } as Record<string, any>,
};
