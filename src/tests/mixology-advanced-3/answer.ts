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
    q3: 0, // Уменьшить и сахар, и биттер
    q4: {answer: false, reason: 0},
    q5: [1,2], // Ошибки по id: id=1 и id=2 (по hint о сладости и биттере)
    q6: 0, // Сладкий вермут (индекс 0) → меньше подсластителя, больше биттера (индекс 0)
    q7: 0, // Определить доминирующее → Проверить связку → Вернуть роль основы → Зафиксировать итог
    q8: 0,
    q9: 0, // Приторно и скучно → снизить подсластитель
    q10: {answer: true, reason: 0},
    q11: [0],
    q12: 0,
  } as Record<string, any>,
};
