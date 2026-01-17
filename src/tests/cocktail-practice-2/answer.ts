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
    q2: 1,
    q3: 2,
    q4: [[0,1],[1,2],[2,0]],
    q5: [2],
    q6: [1,0,2],
    q7: 0,
    q8: [0,1],
    q9: 0,
    q10: 1,
    q11: [0,1],
    q12: [1,2,2],
    q13: 0,
    q14: [0,0],
    q15: [3],
    q16: 0,
    q17: 0,
    q18: {"0":0,"1":1,"2":2},
  } as Record<string, any>,
};
