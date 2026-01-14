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
  category: string;
  questions: PublicTestQuestion[];
};

export const TECHNIQUES_1_PUBLIC: PublicTest = {
  id: "techniques-basics-1",
  title: "Основы барного дела",
  description: "5 вопросов о базовых техниках и инструментах бармена.",
  category: "техники",
  questions: [
    {
      id: "q1",
      text: "Какой метод используется для приготовления коктейля 'Old Fashioned'?",
      options: ["Shake", "Stir", "Build", "Muddle"],
    },
    {
      id: "q2",
      text: "Что такое 'dry shake'?",
      options: [
        "Встряхивание без льда",
        "Встряхивание с большим количеством льда",
        "Медленное перемешивание",
        "Двойное встряхивание"
      ],
    },
    {
      id: "q3",
      text: "Какой инструмент используется для измерения ингредиентов?",
      options: ["Jigger", "Strainer", "Muddler", "Shaker"],
    },
    {
      id: "q4",
      text: "Что означает термин 'neat' при подаче напитка?",
      options: [
        "Со льдом",
        "Без льда, без добавок",
        "С содовой",
        "С тоником"
      ],
    },
    {
      id: "q5",
      text: "Какой коктейль готовится методом 'build'?",
      options: ["Martini", "Mojito", "Gin & Tonic", "Cosmopolitan"],
    },
  ],
};
