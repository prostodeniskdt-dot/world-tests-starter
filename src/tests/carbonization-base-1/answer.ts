import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const CARBONIZATION_BASE_1_SECRET = {
  id: "carbonization-base-1",
  basePoints: 200,
  difficulty: 1,
  maxAttempts: null as number | null,
  answerKey: {
    q1: 2, // C
    q2: 1, // B
    q3: [1,0], // [1]=B, [2]=A
    q4: 1, // B
    q5: [[0,0],[1,1],[2,0],[3,0]], // 1–A, 2–B, 3–A, 4–A
    q6: 0, // A (True)
    q7: {0: 1, 1: 0, 2: 1, 3: 0}, // Matrix: 1↓↑, 2↑↓, 3↓↓, 4↑↓
    q8: [0,1,3], // A, B, D
    q9: 1, // B
    q10: 1, // B (1 и 2)
    q11: [1,2,0,3], // B→C→D→A
    q12: 1, // B
    q13: {step1: 0, step2Mapping: {0: 1}}, // Шаг 1 — A; Шаг 2 — B
    q14: {"Группа 1 — повышает растворимость CO₂": [0,2,3,5], "Группа 2 — снижает растворимость CO₂": [1,4]}, // Г1:авге; Г2:бд
    q15: 1, // B
    q16: 0, // A
    q17: [1,0], // [1]=B, [2]=A
    q18: [0,1] // A, B
  } as Record<string, any>,
};
