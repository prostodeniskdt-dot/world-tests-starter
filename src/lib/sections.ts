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
    description: "Тесты по напиткам, продуктам и работе в индустрии",
    href: "/tests",
    icon: ClipboardList,
  },
  {
    id: "pairings",
    title: "Сочетания",
    description: "Поиск сочетаний, конструктор и небольшая игра",
    href: "/pairings",
    icon: BookOpen,
  },
  {
    id: "knowledge",
    title: "База знаний",
    description: "Статьи, инструкции и разборы",
    href: "/knowledge",
    icon: Library,
  },
  {
    id: "alcohol",
    title: "Алкоголь",
    description: "Виды, регионы, производство и особенности напитков",
    href: "/alcohol",
    icon: Wine,
  },
  {
    id: "na",
    title: "Б/а (безалкогольное)",
    description: "Сиропы, пюре, тоники и другие ингредиенты",
    href: "/na",
    icon: Coffee,
  },
  {
    id: "technique",
    title: "Техника и навыки",
    description: "Оборудование и приёмы для бара, кухни и производства",
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
    description: "Бокалы, инвентарь и кухонная посуда",
    href: "/glassware",
    icon: UtensilsCrossed,
  },
  {
    id: "preps",
    title: "Заготовки",
    description: "Сиропы, кордиалы, гарниши и другие заготовки",
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
    description: "Сочетания, оборудование и рабочие приёмы",
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
    description: "Рейтинг и профили пользователей",
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
        description: "Результаты тестов и опубликованные материалы",
        href: "/profile",
      },
    ],
  },
  {
    id: "contribute",
    title: "Поделиться",
    description: "Добавить материал на сайт",
    items: [
      {
        id: "submit-knowledge",
        title: "Статья",
        description: "Статья, инструкция или разбор",
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
        description: "Добавить напиток в каталог",
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
        description: "Приём или пошаговая инструкция",
        href: "/technique/skills/submit",
      },
      {
        id: "submit-equipment",
        title: "Оборудование",
        description: "Карточка оборудования или инвентаря",
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
