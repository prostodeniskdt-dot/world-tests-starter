/**
 * Parser for raw text from "Таблица сочетания.pdf"
 * Extracts main ingredients and their paired ingredients, with categorization.
 */

// --- Types ---

export interface ParsedPairing {
  mainIngredient: string;
  pairedIngredients: string[];
  category: 'fruits' | 'herbs_spices' | 'other';
}

// --- Category lookup (non-exhaustive; extend as needed) ---

const FRUITS_BERRIES = new Set([
  'агава', 'абрикос', 'ананас', 'айва', 'арбуз', 'авокадо', 'банан', 'бузина', 'брусника', 'виноград',
  'вишня', 'гранат', 'грейпфрут', 'груша', 'гуава', 'дыня', 'ежевика', 'инжир', 'карамболь',
  'карамбола', 'канталупа', 'киви', 'клубника', 'клюква', 'кокос', 'крыжовник', 'кумкват', 'лайм',
  'лимон', 'личи', 'лонган', 'манго', 'мандарин', 'малина', 'маракуйя', 'морошка', 'мушмула',
  'нектарин', 'папайя', 'персик', 'питахайя', 'рамбутан', 'ревень', 'саусеп', 'слива', 'смородина',
  'танжерин', 'тыква', 'финик', 'хурма', 'шелка', 'шелковица', 'яблоко', 'ягоды',
  'годжи', 'голубика', 'дуриан', 'джекфрут', 'чернослив', 'асаи', 'апельсин',
]);

const HERBS_SPICES = new Set([
  'анис', 'бадьян', 'базилик', 'бузина', 'ваниль', 'гвоздика', 'имбирь', 'кардамон', 'кориандр',
  'корица', 'кумин', 'лавровый', 'лавр', 'лаванда', 'лемонграсс', 'майоран', 'мята', 'орегано',
  'петрушка', 'перец', 'розмарин', 'ромашка', 'шалфей', 'тимьян', 'укроп', 'фенхель', 'чили',
  'тархун', 'одуванчик', 'жасмин', 'гибискус', 'роза', 'фиалка', 'полынь',
  'лист', 'листья', 'цветки', 'цветы', 'душистый', 'карри', 'куркума', 'паприка',
  'листья кассии', 'листья кафир-лайма', 'лист кафир-лайма', 'лист лайма',
  'лимонный тимьян', 'розмари', // typo in source
]);

const OTHER = new Set([
  'мёд', 'мед', 'шоколад', 'кофе', 'миндаль', 'кешью', 'фисташка', 'фундук', 'пекан', 'каштан',
  'грецкий', 'макадамия', 'арахис', 'карамель', 'кленовый', 'сироп', 'тоффи', 'ириска',
  'огурец', 'томат', 'морковь', 'сельдерей', 'сливки', 'цветы', 'цветки бузины',
  'вода', 'флёрдоранж', 'агава', 'орех', 'орехи',
]);

function normalizeForLookup(s: string): string {
  return s.toLowerCase().trim();
}

function getCategory(main: string): 'fruits' | 'herbs_spices' | 'other' {
  const lower = normalizeForLookup(main);
  const base = lower.replace(/\s*\([^)]+\)\s*/g, '').trim();
  const firstWord = base.split(/\s+/)[0] ?? '';

  // Check "other" first (nuts, honey, chocolate, coffee, veg)
  if (OTHER.has(firstWord) || OTHER.has(base) ||
      /\b(миндаль|кешью|фисташка|фундук|пекан|каштан|грецкий|макадамия|арахис|кедровый|мёд|шоколад|кофе|карамель|кленовый|огурец|томат|морковь|сельдерей)\b/.test(base)) {
    return 'other';
  }
  // Fruits & berries
  if (FRUITS_BERRIES.has(base) || FRUITS_BERRIES.has(firstWord) ||
      /смородина|апельсин|виноград|малина|клюква|клубника|голубика|крыжовник|морошка|шелковица|инжир|финик|манго|папайя|дыня|арбуз|канталупа|слива|персик|нектарин|абрикос|айва|хурма|гранат|киви|личи|маракуйя|гуава|дуриан|джекфрут|питахайя|рамбутан|танжерин|мушмула|ревень|годжи|голубика|ежевика/.test(base)) {
    return 'fruits';
  }
  // Herbs & spices
  if (HERBS_SPICES.has(firstWord) || HERBS_SPICES.has(base) ||
      /тимьян|шалфей|базилик|розмарин|мята|укроп|петрушка|орегано|лавр|ваниль|имбирь|корица|гвоздика|кардамон|анис|чили|перец|фенхель|одуванчик|жасмин|гибискус|роза|ромашка|фиалка|тархун|лемонграсс|бадьян|кориандр|лавровый/.test(base)) {
    return 'herbs_spices';
  }
  return 'other';
}

// --- Parsing ---

const PAGE_MARKER = /^--\s*\d+\s+of\s+\d+\s*--$/;
const HEADER = /^Основной ингредиент/i;

function startsWithUpperCaseCyrillic(s: string): boolean {
  if (!s || !s[0]) return false;
  const c = s[0];
  return (c >= '\u0410' && c <= '\u042F') || c === '\u0401'; // А-Я, Ё
}

function isLowercaseCyrillicOrLatin(s: string): boolean {
  if (!s || !s[0]) return false;
  const c = s[0];
  return (
    (c >= '\u0430' && c <= '\u044F') || c === '\u0451' || // а-я, ё
    (c >= 'a' && c <= 'z')
  );
}

/**
 * Detects if the last word on the line is a paired ingredient (lowercase).
 * If so, returns { main, firstPaired }. Otherwise returns { main: line, firstPaired: null }.
 */
function splitMainAndFirstPaired(line: string): { main: string; firstPaired: string | null } {
  const trimmed = line.trim();
  if (!trimmed) return { main: '', firstPaired: null };

  const parts = trimmed.split(/\s+/);
  // Find last word that starts with lowercase - that's the first paired
  let lastLowerIdx = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] && isLowercaseCyrillicOrLatin(parts[i])) {
      lastLowerIdx = i;
      break;
    }
  }

  if (lastLowerIdx <= 0) {
    return { main: trimmed, firstPaired: null };
  }

  const main = parts.slice(0, lastLowerIdx).join(' ').trim();
  const firstPaired = parts.slice(lastLowerIdx).join(' ');
  return { main, firstPaired };
}

/**
 * Parses raw PDF text into structured pairings.
 */
export function parseFlavorPairings(rawText: string): ParsedPairing[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim());
  const result: Map<string, string[]> = new Map();

  let currentMain: string | null = null;
  let currentPaired: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    if (HEADER.test(line)) continue;
    if (PAGE_MARKER.test(line)) continue;

    if (startsWithUpperCaseCyrillic(line)) {
      // Flush previous block
      if (currentMain) {
        const existing = result.get(currentMain) ?? [];
        const merged = [...new Set([...existing, ...currentPaired])];
        result.set(currentMain, merged);
      }

      const { main, firstPaired } = splitMainAndFirstPaired(line);
      currentMain = main;
      currentPaired = firstPaired ? [firstPaired] : [];
      continue;
    }

    // Continuation line (paired ingredient)
    if (currentMain && isLowercaseCyrillicOrLatin(line)) {
      currentPaired.push(line);
    }
  }

  if (currentMain) {
    const existing = result.get(currentMain) ?? [];
    result.set(currentMain, [...new Set([...existing, ...currentPaired])]);
  }

  // Build output with categories and merge duplicates (Map already dedupes mains)
  return Array.from(result.entries()).map(([mainIngredient, pairedIngredients]) => ({
    mainIngredient,
    pairedIngredients,
    category: getCategory(mainIngredient),
  }));
}

// --- CLI ---

import * as fs from 'fs';
import * as path from 'path';

function main() {
  const rawPath = path.join(__dirname, 'tablica-sochetaniya-raw.txt');
  let raw: string;
  try {
    raw = fs.readFileSync(rawPath, 'utf-8');
  } catch {
    console.error(`Файл не найден: ${rawPath}`);
    console.error('Создайте tablica-sochetaniya-raw.txt с текстом из PDF.');
    process.exit(1);
  }
  const parsed = parseFlavorPairings(raw);
  console.log(JSON.stringify(parsed.slice(0, 12), null, 2));
  console.log(`\n... всего ${parsed.length} ингредиентов`);
}

if (process.argv[1]?.includes("parse-flavor-pairings")) {
  main();
}
