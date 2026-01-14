import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const TECHNIQUES_1_SECRET = {
  id: "techniques-basics-1",
  basePoints: 100,
  difficulty: 1.0,
  maxAttempts: null as number | null, // null = без ограничений, число = лимит попыток
  // correct option index (0-based)
  answerKey: {
    q1: 2, // Build
    q2: 0, // Встряхивание без льда
    q3: 0, // Jigger
    q4: 1, // Без льда, без добавок
    q5: 2, // Gin & Tonic
  } as Record<string, number>,
};
