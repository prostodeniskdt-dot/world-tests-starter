import type { PublicTest } from "../techniques-1/public";

export const WHISKEY_2_PUBLIC: PublicTest = {
  id: "whiskey-scotch-2",
  title: "Шотландский виски",
  description: "5 вопросов о шотландском виски: регионы, бренды, особенности.",
  category: "виски",
  questions: [
    {
      id: "q1",
      type: "multiple-choice",
      text: "Какой регион Шотландии производит больше всего виски?",
      options: ["Highlands", "Islay", "Lowlands", "Speyside"],
    },
    {
      id: "q2",
      type: "multiple-choice",
      text: "Что означает 'cask strength' виски?",
      options: [
        "Виски без разбавления",
        "Виски с добавками",
        "Виски в специальной бочке",
        "Виски с длительной выдержкой"
      ],
    },
    {
      id: "q3",
      type: "multiple-choice",
      text: "Какой известный бренд производит виски 'Macallan'?",
      options: ["Speyside", "Highlands", "Islay", "Lowlands"],
    },
    {
      id: "q4",
      type: "multiple-choice",
      text: "Что такое 'finish' в виски?",
      options: [
        "Дополнительная выдержка в другой бочке",
        "Фильтрация напитка",
        "Добавление воды",
        "Процесс розлива"
      ],
    },
    {
      id: "q5",
      type: "multiple-choice",
      text: "Какой виски известен своим дымным вкусом из-за использования торфа?",
      options: ["Glenfiddich", "Laphroaig", "Glenlivet", "Macallan"],
    },
  ],
};
