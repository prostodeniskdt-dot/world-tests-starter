import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const CARBONIZATION_PRACTICE_2_SECRET = {
  id: "carbonization-practice-2",
  basePoints: 200,
  difficulty: 2,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 0,
    q2: [0,3],
    q3: [[0,1],[1,2],[2,0],[3,3]],
    q4: {"answer":true,"reason":0},
    q5: [1], // "смеси газов" (index 0 в options + 1 для select value)
    q6: 0,
    q7: [0,3,1,2],
    q8: [0,3],
    q9: [[0,0],[1,1],[2,2],[3,3]],
    q10: {"answer":true,"reason":0},
    q11: [1,5],
    q12: 0,
    q13: 0,
    q14: [[0,1,4],[2,3]],
    q15: [1], // "снижается" (index 0 в options + 1 для select value)
    q16: {"step1":0,"step2":0}, // "Растворимость повышается" -> "Холод повышает растворимость..."
    q17: {"0":0,"1":2,"2":1},
    q18: 0,
    q19: [[0,0],[1,1],[2,2],[3,3]],
    q20: 0,
  } as Record<string, any>,
};
