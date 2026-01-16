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
    q1: {step1: 0, step2Mapping: {0: 0, 1: 1, 2: 2, 3: 3}},
    q2: [3,5],
    q3: 0,
    q4: [[0,3],[1,1],[2,0],[3,2]],
    q5: [0,2],
    q6: [0,3,1,2],
    q7: {0:0, 1:1, 2:2},
    q8: {answer: false, reason: 0},
    q9: 0,
    q10: [1,4],
    q11: [0,1,3],
    q12: {"Безопасность":[0,1,4], "Качество":[2,3]},
    q13: {0:0, 1:0, 2:2},
    q14: 0,
    q15: {answer: true, reason: 0},
    q16: [[0,2],[1,0],[2,1],[3,3]],
    q17: [0,2],
    q18: [1,0,3,2],
    q19: {0:1, 1:0, 2:2},
    q20: 0,
    q21: null,
  } as Record<string, any>,
};
