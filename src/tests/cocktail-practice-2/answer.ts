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
    q2: [0,3,5],
    q3: [[0,1],[1,3],[2,0],[3,2]],
    q4: {answer: false, reason: 0},
    q5: [0],
    q6: [3,5], // Ошибки: id=3 "хоторн хуже удерживает" и id=5 "чайное для крупных"
    q7: {"Зачем":[0,1], "Как":[2,3,4]},
    q8: {0:0, 1:1, 2:2},
    q9: [1,0,2,3],
    q10: 0,
    q11: [0,2],
    q12: 0,
    q13: {answer: false, reason: 0},
    q14: [[0,1],[1,0],[2,3],[3,2]],
    q15: [2,1,0,3],
    q16: 0,
    q17: 0,
    q18: [0,2],
    q19: {0:0, 1:1, 2:2},
    q20: 0,
  } as Record<string, any>,
};
