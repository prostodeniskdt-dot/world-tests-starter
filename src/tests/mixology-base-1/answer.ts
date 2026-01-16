import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const MIXOLOGY_BASE_1_SECRET = {
  id: "mixology-base-1",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 0,
    q2: [[0,0],[1,3],[2,2],[3,1]],
    q3: 0,
    q4: [0,1,2,3],
    q5: {answer: false, reason: 0},
    q6: [0,3],
    q7: 0,
    q8: {"Усиление основы":[0,2], "Смещение баланса":[1,3,4]},
    q9: 0,
    q10: [0],
    q11: 0,
    q12: {answer: true, reason: 0},
    q13: 0,
    q14: [[0,1],[1,2],[2,0],[3,3]],
    q15: 0,
    q16: [1,4],
    q17: 0,
    q18: 0,
    q19: [3,2,0,1],
    q20: 0,
  } as Record<string, any>,
};
