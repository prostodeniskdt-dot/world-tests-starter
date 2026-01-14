import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const WHISKEY_1_SECRET = {
  id: "whiskey-basics-1",
  basePoints: 150,
  difficulty: 1.5,
  maxAttempts: null as number | null, // null = без ограничений, число = лимит попыток
  // correct option index (0-based)
  answerKey: {
    q1: 1, // Ячмень
    q2: 0, // Виски из одного винокуренного завода
    q3: 1, // 3 года
    q4: 1, // Islay
    q5: 1, // Дымный, торфяной вкус
  } as Record<string, number>,
};
