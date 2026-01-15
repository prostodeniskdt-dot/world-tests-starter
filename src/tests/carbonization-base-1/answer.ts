import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const CARBONIZATION_BASE_1_SECRET = {
  id: "carbonization-base-1",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 1,
    q2: 0,
    q3: [[0,1],[1,0],[2,2],[3,3]],
    q4: 0,
    q5: [3,0,2,1],
    q6: 0,
    q7: [[0,1],[2,3]],
    q8: 0,
    q9: [0,3],
    q10: [1,2,3,0],
    q11: {"1":0},
    q12: 0,
    q13: [[0,2],[1,0],[2,3],[3,1]],
    q14: 0,
    q15: [1,2,0,3],
    q16: 0,
    q17: [[0,1,4],[2,3]],
    q18: 0,
    q19: [[0,0],[1,1],[2,3],[3,2]],
    q20: 0,
  } as Record<string, any>,
};
