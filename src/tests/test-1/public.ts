export type PublicTestQuestion = {
  id: string;
  text: string;
  options: string[];
  imageUrl?: string; // Путь к изображению в папке media/
  videoUrl?: string; // Путь к видео в папке media/
};

export type PublicTest = {
  id: string;
  title: string;
  description: string;
  questions: PublicTestQuestion[];
};

export const TEST_1_PUBLIC: PublicTest = {
  id: "demo-logic-1",
  title: "Демо тест: логика и математика",
  description:
    "5 вопросов. Результат даёт очки и влияет на место в рейтинге.",
  questions: [
    {
      id: "q1",
      text: "Сколько будет 12 × 12?",
      options: ["122", "124", "144", "154"],
    },
    {
      id: "q2",
      text: "Если A = 1, B = 2, ..., то чему равно C + D?",
      options: ["5", "6", "7", "8"],
    },
    {
      id: "q3",
      text: "Какое число лишнее: 2, 3, 5, 9, 11",
      options: ["2", "3", "9", "11"],
    },
    {
      id: "q4",
      text: "Продолжи последовательность: 1, 1, 2, 3, 5, 8, ?",
      options: ["11", "12", "13", "14"],
    },
    {
      id: "q5",
      text: "Если 3x + 2 = 11, то x = ?",
      options: ["2", "3", "4", "5"],
    },
  ],
};
