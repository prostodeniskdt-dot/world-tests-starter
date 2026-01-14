import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const WHISKEY_2_SECRET = {
  id: "whiskey-scotch-2",
  basePoints: 150,
  difficulty: 1.5,
  maxAttempts: null as number | null, // null = без ограничений, число = лимит попыток
  // correct option index (0-based)
  answerKey: {
    q1: 3, // Speyside
    q2: 0, // Виски без разбавления
    q3: 0, // Speyside
    q4: 0, // Дополнительная выдержка в другой бочке
    q5: 1, // Laphroaig
  } as Record<string, number>,
};
