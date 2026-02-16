/**
 * Проверяет, что для matching-вопросов в тестах test-941e9b55 и test-fc2848b9
 * правильный ответ засчитывается (checkAnswer возвращает true).
 *
 * Запуск: npx tsx scripts/verify-matching-keys.ts
 * Не требует БД — использует данные из answer.ts и public.ts через getSecretTest/getPublicTest
 * не вызываются; данные захардкожены для проверки логики answer-checkers.
 */

import { checkAnswer } from "../src/lib/answer-checkers";
import type { PublicTestQuestion } from "../src/tests/types";

const TESTS: Array<{
  testId: string;
  question: PublicTestQuestion;
  correctAnswer: unknown;
  correctUserAnswer: [number, number][];
}> = [
  {
    testId: "test-941e9b55",
    question: {
      id: "q1771242463408",
      type: "matching",
      text: "Сопоставьте фактор и эффект",
      leftItems: [
        "Повышение температуры",
        "Увеличение давления",
        "Рост содержания сахара",
      ],
      rightItems: [
        "Снижение растворимости CO₂",
        "Повышение растворимости CO₂",
        "Уменьшение доступного объёма растворителя",
      ],
    } as PublicTestQuestion,
    correctAnswer: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    correctUserAnswer: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
  },
  {
    testId: "test-fc2848b9",
    question: {
      id: "q1771255011091",
      type: "matching",
      text: "Сопоставьте процесс и объясняющий принцип:",
      leftItems: [
        "1. Растворение CO₂ при повышенном давлении",
        "2. Выход газа при нагревании",
        "3. Смещение равновесия при добавлении кислоты",
      ],
      rightItems: [
        "A. Закон Генри",
        "B. Принцип Ле Шателье",
        "C. Зависимость растворимости от кинетической энергии",
      ],
    } as PublicTestQuestion,
    correctAnswer: [
      [0, 0],
      [1, 2],
      [2, 1],
    ],
    correctUserAnswer: [
      [0, 0],
      [1, 2],
      [2, 1],
    ],
  },
];

function main() {
  console.log("=== Проверка matching: правильный ответ должен засчитываться ===\n");
  let ok = true;
  for (const { testId, question, correctAnswer, correctUserAnswer } of TESTS) {
    const result = checkAnswer(question, correctUserAnswer, correctAnswer);
    const status = result ? "✓ OK" : "✗ FAIL";
    console.log(`${testId} ${question.id}: ${status}`);
    if (!result) ok = false;
  }
  console.log(ok ? "\nВсе проверки пройдены." : "\nЕсть ошибки.");
  process.exit(ok ? 0 : 1);
}

main();
