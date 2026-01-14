import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const TECHNIQUES_2_SECRET = {
  id: "techniques-classic-2",
  basePoints: 120,
  difficulty: 1.2,
  maxAttempts: null as number | null, // null = без ограничений, число = лимит попыток
  // correct option index (0-based)
  answerKey: {
    q1: 0, // Джин, вермут, биттер
    q2: 1, // 2:1:1
    q3: 0, // Водка
    q4: 1, // Украшение напитка
    q5: 2, // Cosmopolitan
  } as Record<string, number>,
};
