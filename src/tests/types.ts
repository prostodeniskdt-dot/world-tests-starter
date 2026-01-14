export type PublicTestQuestion = {
  id: string;
  text: string;
  type: "multiple-choice" | "text";
  options?: string[]; // Только для multiple-choice
  hint?: string; // Справка для показа после ответа
  imageUrl?: string; // Путь к изображению в папке media/
  videoUrl?: string; // Путь к видео в папке media/
};

export type PublicTest = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: 1 | 2 | 3; // Уровень сложности (барные ложки)
  questions: PublicTestQuestion[];
};
