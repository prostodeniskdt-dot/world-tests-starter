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
    q2: 2,
    q3: [0,0],
    q4: 0,
    q5: 0,
    q6: [0,1],
    q7: 0,
    q8: [[0,1],[1,2],[2,0]],
    q9: [1],
    q10: [1,2,0],
    q11: 0,
    q12: 0,
    q13: 1,
    q14: [0,1],
    q15: 0,
    q16: {"step1":0,"step2Mapping":{"0":0}},
    q17: 0,
    q18: [0,0],
  } as Record<string, any>,
};
