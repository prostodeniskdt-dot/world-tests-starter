import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const MIXOLOGY_PRACTICE_2_SECRET = {
  id: "mixology-practice-2",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 0,
    q2: 0,
    q3: [[0,1],[1,0],[2,2],[3,3]],
    q4: {answer: false, reason: 0},
    q5: [0,0],
    q6: [0,3],
    q7: [0,1,2,3],
    q8: [0,2],
    q9: 0,
    q10: {step1: 0, step2Mapping: {0: 0, 1: 1, 2: 2, 3: 3}},
    q11: {answer: true, reason: 0},
    q12: {0: 0, 1: 1, 2: 2},
  } as Record<string, any>,
};
