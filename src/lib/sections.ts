import {
  ClipboardList,
  BookOpen,
  Library,
  Wine,
  Coffee,
  Wrench,
  Martini,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type Section = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const SECTIONS: Section[] = [
  {
    id: "tests",
    title: "Тесты",
    description: "Тесты по барной тематике и мировой рейтинг участников",
    href: "/tests",
    icon: ClipboardList,
  },
  {
    id: "pairings",
    title: "Сочетания",
    description: "Мини-игра и база знаний о сочетаниях вкусов",
    href: "/pairings",
    icon: BookOpen,
  },
  {
    id: "knowledge",
    title: "База знаний",
    description: "Статьи, юридические вопросы, авторские материалы",
    href: "/knowledge",
    icon: Library,
  },
  {
    id: "alcohol",
    title: "Алкоголь",
    description: "Каталог крепкого алкоголя с категориями и карточками",
    href: "/alcohol",
    icon: Wine,
  },
  {
    id: "na",
    title: "Б/а (безалкогольное)",
    description: "Сиропы, пюре, тоники и прочие б/а ингредиенты",
    href: "/na",
    icon: Coffee,
  },
  {
    id: "technique",
    title: "Техника и навыки",
    description: "Оборудование, приёмы и техники работы за баром",
    href: "/technique",
    icon: Wrench,
  },
  {
    id: "cocktails",
    title: "Коктейли",
    description: "Классика и авторские рецепты",
    href: "/cocktails",
    icon: Martini,
  },
  {
    id: "glassware",
    title: "Посуда",
    description: "Бокалы, инвентарь, кухонная посуда",
    href: "/glassware",
    icon: UtensilsCrossed,
  },
];
