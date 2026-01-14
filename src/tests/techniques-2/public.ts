import type { PublicTest } from "../techniques-1/public";

export const TECHNIQUES_2_PUBLIC: PublicTest = {
  id: "techniques-classic-2",
  title: "Классические коктейли",
  description: "5 вопросов о знаменитых классических коктейлях и их рецептах.",
  category: "техники",
  questions: [
    {
      id: "q1",
      type: "multiple-choice",
      text: "Какие основные ингредиенты в коктейле 'Negroni'?",
      options: [
        "Джин, вермут, биттер",
        "Водка, вермут, биттер",
        "Ром, вермут, биттер",
        "Текила, вермут, биттер"
      ],
    },
    {
      id: "q2",
      type: "multiple-choice",
      text: "В каком соотношении готовится коктейль 'Manhattan'?",
      options: ["2:1:2", "2:1:1", "3:1:1", "1:1:1"],
    },
    {
      id: "q3",
      type: "multiple-choice",
      text: "Какой напиток является основой для 'Moscow Mule'?",
      options: ["Водка", "Джин", "Ром", "Виски"],
    },
    {
      id: "q4",
      type: "multiple-choice",
      text: "Что такое 'garnish' в коктейле?",
      options: [
        "Основной ингредиент",
        "Украшение напитка",
        "Тип стакана",
        "Метод приготовления"
      ],
    },
    {
      id: "q5",
      type: "multiple-choice",
      text: "Какой коктейль подается в бокале 'coupe'?",
      options: ["Old Fashioned", "Martini", "Cosmopolitan", "Mojito"],
    },
  ],
};
