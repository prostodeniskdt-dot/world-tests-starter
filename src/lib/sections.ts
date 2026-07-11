import {
  ClipboardList,
  BookOpen,
  Library,
  Wine,
  Coffee,
  Wrench,
  Martini,
  UtensilsCrossed,
  Package,
  type LucideIcon,
} from "lucide-react";

export type Section = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type NavigationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  sectionId?: Section["id"];
};

export type NavigationGroup = {
  id: string;
  title: string;
  description: string;
  items: NavigationItem[];
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
  {
    id: "preps",
    title: "Заготовки",
    description: "Сиропы, кордиалы, гарниши и другие заготовки для бара и кухни",
    href: "/preps",
    icon: Package,
  },
];

const SECTION_BY_ID = new Map(SECTIONS.map((section) => [section.id, section]));

function sectionItem(sectionId: string): NavigationItem {
  const section = SECTION_BY_ID.get(sectionId);
  if (!section) {
    throw new Error(`Unknown section in navigation: ${sectionId}`);
  }
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    href: section.href,
    sectionId: section.id,
  };
}

/**
 * Единая информационная архитектура сайта. Разделы остаются самостоятельными,
 * но в интерфейсе сгруппированы по задачам пользователя.
 */
export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    id: "learn",
    title: "Учиться",
    description: "Проверять знания и изучать материалы",
    items: [sectionItem("tests"), sectionItem("knowledge")],
  },
  {
    id: "practice",
    title: "Практика",
    description: "Решения и инструменты для работы за баром",
    items: [sectionItem("pairings"), sectionItem("technique")],
  },
  {
    id: "reference",
    title: "Справочник",
    description: "Рецепты, ингредиенты, заготовки и посуда",
    items: [
      sectionItem("cocktails"),
      sectionItem("alcohol"),
      sectionItem("na"),
      sectionItem("preps"),
      sectionItem("glassware"),
    ],
  },
  {
    id: "people",
    title: "Участники",
    description: "Рейтинг и профессиональные профили",
    items: [
      {
        id: "leaderboard",
        title: "Рейтинг участников",
        description: "Результаты тестов и активные участники",
        href: "/tests#leaderboard",
      },
      {
        id: "profile",
        title: "Мой профиль",
        description: "Результаты, опыт и опубликованные материалы",
        href: "/profile",
      },
    ],
  },
  {
    id: "contribute",
    title: "Поделиться",
    description: "Передать коллегам свой практический опыт",
    items: [
      {
        id: "submit-knowledge",
        title: "Статья",
        description: "Разбор, инструкция или профессиональный опыт",
        href: "/knowledge/submit",
      },
      {
        id: "submit-cocktail",
        title: "Коктейль",
        description: "Классический или авторский рецепт",
        href: "/cocktails/submit",
      },
      {
        id: "submit-prep",
        title: "Заготовка",
        description: "Сироп, кордиал, гарнир или другая заготовка",
        href: "/preps/submit",
      },
      {
        id: "submit-alcohol",
        title: "Алкоголь",
        description: "Дополнить каталог алкогольных продуктов",
        href: "/alcohol/submit",
      },
      {
        id: "submit-na",
        title: "Б/а ингредиент",
        description: "Сироп, пюре, тоник или другой ингредиент",
        href: "/na/submit",
      },
      {
        id: "submit-skill",
        title: "Техника работы",
        description: "Приём или практическая инструкция",
        href: "/technique/skills/submit",
      },
      {
        id: "submit-equipment",
        title: "Оборудование",
        description: "Опыт использования инвентаря",
        href: "/technique/equipment/submit",
      },
      {
        id: "submit-glassware",
        title: "Посуда",
        description: "Бокал, инвентарь или кухонная посуда",
        href: "/glassware/submit",
      },
    ],
  },
];

export function isNavigationItemActive(pathname: string, href: string): boolean {
  const path = href.split("#")[0].split("?")[0] || "/";
  if (path === "/") return pathname === "/";
  if (path === "/tests" && pathname === "/test") return true;
  return pathname === path || pathname.startsWith(`${path}/`);
}
