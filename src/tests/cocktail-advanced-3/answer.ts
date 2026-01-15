import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const COCKTAIL_ADVANCED_3_SECRET = {
  id: "cocktail-advanced-3",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: null,
    q2: [3,5],
    q3: 0,
    q4: null,
    q5: 0,
    q6: [0,3,1,2],
    q7: null,
    q8: null,
    q9: 0,
    q10: [1,4],
    q11: 0,
    q12: null,
    q13: null,
    q14: 0,
    q15: null,
    q16: null,
    q17: 0,
    q18: [1,0,3,2],
    q19: null,
    q20: 0,
    q21: null,
  } as Record<string, any>,
};
