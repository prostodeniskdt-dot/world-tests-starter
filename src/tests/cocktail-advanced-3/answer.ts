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
    q1: {"step1":0,"step2Mapping":{"0":0}},
    q2: 0,
    q3: {"0":0,"1":1,"2":1},
    q4: 0,
    q5: [1,0,2],
    q6: [0,1,3],
    q7: 0,
    q8: 0,
    q9: 0,
    q10: [0],
    q11: 0,
    q12: [0,1,3],
    q13: [1],
    q14: 0,
    q15: [[0,2],[1,0],[2,1]],
    q16: [0,1],
    q17: 0,
    q18: 0,
  } as Record<string, any>,
};
