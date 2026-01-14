import "server-only";

/**
 * ВНИМАНИЕ:
 * Этот файл нельзя импортировать в клиентские компоненты,
 * иначе правильные ответы утекут в браузер.
 */

export const VODKA_1_SECRET = {
  id: "vodka-basics-1",
  basePoints: 100,
  difficulty: 1.0,
  maxAttempts: null as number | null, // null = без ограничений, число = лимит попыток
  // correct option index (0-based)
  answerKey: {
    q1: 3, // Все перечисленные
    q2: 3, // Россия и Польша спорят
    q3: 0, // Многократная дистилляция и очистка
    q4: 2, // 40-45%
    q5: 0, // Фильтрация при низкой температуре
  } as Record<string, number>,
};
