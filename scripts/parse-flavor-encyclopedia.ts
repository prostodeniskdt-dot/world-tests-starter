/**
 * Парсер энциклопедии сочетаний из xlsx-файлов в папке baza/.
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { extractRussianIngredient } from "../src/lib/ingredient-normalize";

export type SectionKey =
  | "drinks"
  | "food"
  | "desserts"
  | "sauces"
  | "universal"
  | "other";

export type EncyclopediaPartDef = {
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  filePattern: RegExp;
};

export const ENCYCLOPEDIA_PARTS: EncyclopediaPartDef[] = [
  {
    slug: "citrus",
    title: "Цитрусовые",
    description:
      "Лимон, лайм, апельсин, грейпфрут, мандарин, бергамот, помело, кумкват, юдзу",
    sortOrder: 1,
    filePattern: /Часть_1A_Цитрусовые\.xlsx$/i,
  },
  {
    slug: "berries",
    title: "Ягоды",
    description: "Клубника, малина, черника, смородина, клюква и другие ягоды",
    sortOrder: 2,
    filePattern: /Часть_1Б_Ягоды\.xlsx$/i,
  },
  {
    slug: "tropical-seeded",
    title: "Тропические и семечковые",
    description: "Манго, ананас, банан, яблоко, груша и другие",
    sortOrder: 3,
    filePattern: /Часть_1В_Тропические_и_семечковые\.xlsx$/i,
  },
  {
    slug: "stone-fruits",
    title: "Косточковые",
    description: "Персик, абрикос, слива, вишня, нектарин",
    sortOrder: 4,
    filePattern: /Часть_2_Косточковые\.xlsx$/i,
  },
  {
    slug: "herbs-flowers",
    title: "Травы, цветы и листья",
    description: "Базилик, мята, розмарин, шалфей, лаванда, цветочные листья",
    sortOrder: 5,
    filePattern: /Часть_3_Травы_цветы_и_листья\.xlsx$/i,
  },
  {
    slug: "spices",
    title: "Специи",
    description:
      "Корица, кардамон, имбирь, ваниль, перец, чили и другие пряности",
    sortOrder: 6,
    filePattern: /Часть_4_Специи\.xlsx$/i,
  },
  {
    slug: "nuts-cocoa-coffee-tea",
    title: "Орехи, какао, кофе и чай",
    description: "Орехи, шоколад, кофе, чай и производные",
    sortOrder: 7,
    filePattern: /Часть_5_Орехи_какао_кофе_и_чай\.xlsx$/i,
  },
  {
    slug: "vegetables-mushrooms",
    title: "Овощи, корнеплоды и грибы",
    description: "Овощи, корнеплоды, бобовые и грибы",
    sortOrder: 8,
    filePattern: /Часть_6_Овощи_корнеплоды_и_грибы\.xlsx$/i,
  },
  {
    slug: "meat-seafood",
    title: "Мясо, птица, рыба и морепродукты",
    description: "Мясные, рыбные и морские продукты",
    sortOrder: 9,
    filePattern: /Часть_7_Мясо_птица_рыба_и_морепродукты\.xlsx$/i,
  },
];

export type ParsedEncyclopediaEntry = {
  externalId: string;
  partSlug: string;
  mainSection: string;
  sectionKey: SectionKey;
  baseIngredient: string | null;
  ingredient1: string;
  ingredient2: string;
  original1: string | null;
  original2: string | null;
  group1: string | null;
  group2: string | null;
  aromaProfile1: string | null;
  aromaProfile2: string | null;
  compounds1: string | null;
  compounds2: string | null;
  mechanismType: string | null;
  explanation: string | null;
  processing: string | null;
  criticalPoints: string | null;
  practicalApplication: string | null;
  confidence: string | null;
  sources: string | null;
  pages: string | null;
};

const DETAIL_SHEETS = new Set([
  "Напитки",
  "Еда",
  "Десерты",
  "Соусы и маринады",
  "Орехи",
  "Какао и шоколад",
  "Кофе",
  "Чай",
]);

const SECTION_KEY_MAP: Record<string, SectionKey> = {
  напитки: "drinks",
  "еда и соусы": "food",
  "десерты и выпечка": "desserts",
  "соусы и маринады": "sauces",
  универсальные: "universal",
};

function cellStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function headerIndex(headers: string[], ...names: string[]): number {
  for (const name of names) {
    const idx = headers.findIndex((h) => h === normalizeHeader(name));
    if (idx >= 0) return idx;
  }
  return -1;
}

function sectionKeyFromMainSection(mainSection: string): SectionKey {
  const key = SECTION_KEY_MAP[mainSection.trim().toLowerCase()];
  return key ?? "other";
}

function sectionKeyFromSheetName(sheetName: string): SectionKey {
  const map: Record<string, SectionKey> = {
    Напитки: "drinks",
    Еда: "food",
    Десерты: "desserts",
    "Соусы и маринады": "sauces",
    Орехи: "food",
    "Какао и шоколад": "desserts",
    Кофе: "drinks",
    Чай: "drinks",
  };
  return map[sheetName] ?? "other";
}

type RowObj = Record<string, string | null>;

function rowToObject(
  headers: string[],
  row: unknown[]
): RowObj {
  const obj: RowObj = {};
  headers.forEach((h, i) => {
    if (h) obj[h] = cellStr(row[i]);
  });
  return obj;
}

function pick(obj: RowObj, ...keys: string[]): string | null {
  for (const key of keys) {
    const norm = normalizeHeader(key);
    if (obj[norm] != null) return obj[norm];
  }
  return null;
}

function parseAllSheet(
  partSlug: string,
  rows: unknown[][]
): ParsedEncyclopediaEntry[] {
  if (rows.length < 2) return [];
  const rawHeaders = (rows[0] as unknown[]).map(normalizeHeader);
  const entries: ParsedEncyclopediaEntry[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row?.length) continue;
    const obj = rowToObject(rawHeaders, row);
    const externalId = pick(obj, "ID");
    const ingredient1 = pick(
      obj,
      "Ингредиент 1",
      "ингредиент 1"
    );
    const ingredient2 = pick(
      obj,
      "Ингредиент 2",
      "ингредиент 2",
      "Партнёр",
      "партнёр"
    );
    if (!externalId || !ingredient1 || !ingredient2) continue;

    const mainSection =
      pick(obj, "Основной раздел", "основной раздел") ?? "Универсальные";

    entries.push({
      externalId,
      partSlug,
      mainSection,
      sectionKey: sectionKeyFromMainSection(mainSection),
      baseIngredient: pick(
        obj,
        "Базовый ингредиент",
        "базовый ингредиент",
        "Базовая специя",
        "базовая специя"
      ),
      ingredient1,
      ingredient2,
      original1: pick(obj, "Оригинал 1", "оригинал 1"),
      original2: pick(obj, "Оригинал 2", "оригинал 2"),
      group1: pick(obj, "Группа 1", "группа 1"),
      group2: pick(
        obj,
        "Группа 2",
        "группа 2",
        "Группа партнёра",
        "группа партнёра"
      ),
      aromaProfile1: pick(obj, "Аромапрофиль 1", "арomapрофиль 1"),
      aromaProfile2: pick(obj, "Аромапрофиль 2", "арomapрофиль 2"),
      compounds1: pick(
        obj,
        "Ключевые соединения 1",
        "ключевые соединения 1"
      ),
      compounds2: pick(
        obj,
        "Ключевые соединения 2",
        "ключевые соединения 2"
      ),
      mechanismType: null,
      explanation: null,
      processing: null,
      criticalPoints: null,
      practicalApplication: null,
      confidence: null,
      sources: null,
      pages: null,
    });
  }

  return entries;
}

function parseDetailSheet(
  sheetName: string,
  rows: unknown[][]
): Map<string, Partial<ParsedEncyclopediaEntry>> {
  const map = new Map<string, Partial<ParsedEncyclopediaEntry>>();
  if (rows.length < 2) return map;

  const rawHeaders = (rows[0] as unknown[]).map(normalizeHeader);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row?.length) continue;
    const obj = rowToObject(rawHeaders, row);
    const externalId = pick(obj, "ID");
    if (!externalId) continue;

    map.set(externalId, {
      baseIngredient: pick(
        obj,
        "Базовый ингредиент",
        "Базовая специя",
        "базовый ингредиент",
        "базовая специя"
      ),
      ingredient1: pick(obj, "Ингредиент 1", "ингредиент 1") ?? undefined,
      ingredient2:
        pick(obj, "Ингредиент 2", "Партнёр", "ингредиент 2", "партнёр") ??
        undefined,
      group2: pick(obj, "Группа партнёра", "группа партнёра") ?? undefined,
      mechanismType:
        pick(obj, "Тип механизма", "тип механизма") ?? undefined,
      explanation:
        pick(
          obj,
          "Подробное научное объяснение",
          "подробное научное объяснение"
        ) ?? undefined,
      processing: pick(obj, "Обработка", "обработка") ?? undefined,
      criticalPoints:
        pick(obj, "Критические точки", "критические точки") ?? undefined,
      practicalApplication:
        pick(
          obj,
          "Практическое применение",
          "практическое применение"
        ) ?? undefined,
      confidence: pick(obj, "Уверенность", "уверенность") ?? undefined,
      sources: pick(obj, "Источники", "источники") ?? undefined,
      pages: pick(obj, "Страницы", "страницы") ?? undefined,
      sectionKey: sectionKeyFromSheetName(sheetName),
    });
  }

  return map;
}

function russifyEntry(entry: ParsedEncyclopediaEntry): ParsedEncyclopediaEntry | null {
  const ingredient1 = extractRussianIngredient(
    entry.ingredient1,
    entry.original1
  );
  const ingredient2 = extractRussianIngredient(
    entry.ingredient2,
    entry.original2
  );
  if (!ingredient1 || !ingredient2) return null;
  if (ingredient1 === ingredient2) return null;

  return {
    ...entry,
    ingredient1,
    ingredient2,
    baseIngredient: entry.baseIngredient
      ? extractRussianIngredient(entry.baseIngredient, entry.baseIngredient)
      : null,
  };
}

function mergeDetails(
  entries: ParsedEncyclopediaEntry[],
  detailMaps: Map<string, Partial<ParsedEncyclopediaEntry>>[]
): ParsedEncyclopediaEntry[] {
  const combined = new Map<string, Partial<ParsedEncyclopediaEntry>>();
  for (const dm of detailMaps) {
    for (const [id, detail] of dm) {
      combined.set(id, { ...combined.get(id), ...detail });
    }
  }

  return entries.map((entry) => {
    const detail = combined.get(entry.externalId);
    if (!detail) return entry;
    return {
      ...entry,
      baseIngredient: detail.baseIngredient ?? entry.baseIngredient,
      group2: detail.group2 ?? entry.group2,
      mechanismType: detail.mechanismType ?? entry.mechanismType,
      explanation: detail.explanation ?? entry.explanation,
      processing: detail.processing ?? entry.processing,
      criticalPoints: detail.criticalPoints ?? entry.criticalPoints,
      practicalApplication:
        detail.practicalApplication ?? entry.practicalApplication,
      confidence: detail.confidence ?? entry.confidence,
      sources: detail.sources ?? entry.sources,
      pages: detail.pages ?? entry.pages,
    };
  });
}

export function parseEncyclopediaFile(
  filePath: string,
  partSlug: string
): ParsedEncyclopediaEntry[] {
  const wb = XLSX.readFile(filePath);
  const allSheet = wb.Sheets["Все сочетания"];
  if (!allSheet) {
    console.warn(`  ⚠ Нет листа «Все сочетания» в ${path.basename(filePath)}`);
    return [];
  }

  const allRows = XLSX.utils.sheet_to_json(allSheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  let entries = parseAllSheet(partSlug, allRows);
  const detailMaps: Map<string, Partial<ParsedEncyclopediaEntry>>[] = [];

  for (const sheetName of wb.SheetNames) {
    if (!DETAIL_SHEETS.has(sheetName)) continue;
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
    }) as unknown[][];
    detailMaps.push(parseDetailSheet(sheetName, rows));
  }

  entries = mergeDetails(entries, detailMaps);
  return entries
    .map(russifyEntry)
    .filter((e): e is ParsedEncyclopediaEntry => e !== null);
}

export function parseAllEncyclopediaFiles(
  bazaDir: string
): ParsedEncyclopediaEntry[] {
  const files = fs.readdirSync(bazaDir).filter((f) => f.endsWith(".xlsx"));
  const all: ParsedEncyclopediaEntry[] = [];

  for (const part of ENCYCLOPEDIA_PARTS) {
    const match = files.find((f) => part.filePattern.test(f));
    if (!match) {
      console.warn(`  ⚠ Файл не найден для части: ${part.title}`);
      continue;
    }
    const filePath = path.join(bazaDir, match);
    console.log(`  Парсинг: ${match}`);
    const entries = parseEncyclopediaFile(filePath, part.slug);
    console.log(`    → ${entries.length} записей`);
    all.push(...entries);
  }

  return all;
}

function main() {
  const bazaDir = path.join(process.cwd(), "baza");
  console.log("Парсинг энциклопедии из", bazaDir);
  const entries = parseAllEncyclopediaFiles(bazaDir);
  console.log(`\nВсего: ${entries.length} записей`);
  if (entries[0]) {
    console.log("\nПример:", JSON.stringify(entries[0], null, 2));
  }
}

if (process.argv[1]?.includes("parse-flavor-encyclopedia")) {
  main();
}
