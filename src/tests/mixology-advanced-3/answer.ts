import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const MIXOLOGY_ADVANCED_3_SECRET = {
  id: "mixology-advanced-3",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 0,
    q2: [0,2],
    q3: {step1: 0, step2Mapping: {0: 0, 1: 1, 2: 2, 3: 3}},
    q4: {answer: false, reason: 0},
    q5: [0,2],
    q6: [[0,0],[1,1],[2,2],[3,3]],
    q7: [0,2,1,3],
    q8: 0,
    q9: {0: 0, 1: 1, 2: 2},
    q10: {answer: true, reason: 0},
    q11: [0],
    q12: 0,
  } as Record<string, any>,
};
