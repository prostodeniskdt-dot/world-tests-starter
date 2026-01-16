import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const COCKTAIL_PRACTICE_2_SECRET = {
  id: "cocktail-practice-2",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 0,
    q2: 0,
    q3: null,
    q4: null,
    q5: null,
    q6: [3,5],
    q7: null,
    q8: null,
    q9: [1,0,2,3],
    q10: 0,
    q11: 0,
    q12: 0,
    q13: null,
    q14: null,
    q15: [2,1,0,3],
    q16: 0,
    q17: 0,
    q18: 0,
    q19: null,
    q20: 0,
  } as Record<string, any>,
};
