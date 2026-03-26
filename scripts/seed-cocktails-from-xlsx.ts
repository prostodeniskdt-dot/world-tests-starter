/**
 * Импорт рецептов коктейлей BlackieBar из xlsx в таблицу cocktails.
 *
 * Запуск:  npm run seed-cocktails
 *          npx tsx scripts/seed-cocktails-from-xlsx.ts
 *
 * Требуется DATABASE_URL в .env.local
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as XLSX from "xlsx";

// ─── Config ──────────────────────────────────────────────────────────────────

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL не найден. Добавьте в .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const AUTHOR = "BlackieBar";
const SOCIAL_LINKS = {
  telegram: "https://t.me/blackiebar",
  dzen: "https://dzen.ru/blackiebar",
  youtube: "https://www.youtube.com/@BlackieBar",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
  number: number;
  name: string;
  ingredients: Ingredient[];
  glass: string | null;
  ice: string | null;
  methods: string[];
  garnishes: string[];
  expressZest: boolean;
  notes: string | null;
  isIBA: boolean;
  mainCategory: string | null;
  subCategory: string | null;
}

// ─── Slugify (mirrors src/lib/slugify.ts) ────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0400-\u04FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── ABV estimation (fraction 0–1) per ingredient name ───────────────────────

function estimateABV(name: string): number {
  const n = name.toLowerCase();

  if (
    /(сок[а-я]*\b|тоник|содов|сливк|молок|яйц|белок|желток|сахар|мёд\b|мед\b|пюре|вод[аы]\b|кипят|энергет|лимонад|газиров|кола\b|спрайт|чай|эспрессо|морс|морожен|сгущ|арбуз|сол[ьи]\b|перец|гвоздик|корица|лист\b|долька|слайс|кубик|совок|салфетк|соус|сельдер|сироп|гренадин|кордиал|оржат|безалкогольн|drinksome|взбит|кокосов|клюквен|померанц|экстракт|ваниль|ромашк|настой|крем\b|высушен|тростник|пудр|песок)/.test(n)
  )
    return 0;

  if (/пиво|эль\b|стаут|лагер|\bipa\b|мексиканск/.test(n)) return 0.05;
  if (/игрист|вино/.test(n)) return 0.12;

  if (/сухой вермут/.test(n)) return 0.18;
  if (/вермут/.test(n)) return 0.16;
  if (/апероль/.test(n)) return 0.11;
  if (/лиллет|кокки/.test(n)) return 0.17;
  if (/портвейн/.test(n)) return 0.20;
  if (/херес/.test(n)) return 0.17;

  if (/ангостура/.test(n)) return 0.44;
  if (/пешо биттер/.test(n)) return 0.35;
  if (/биттер/.test(n)) return 0.44;
  if (/кампари/.test(n)) return 0.25;
  if (/сьюз/.test(n)) return 0.15;
  if (/чинар/.test(n)) return 0.17;

  if (/зеленый шартрез/.test(n)) return 0.55;
  if (/желтый шартрез/.test(n)) return 0.40;
  if (/бенедиктин/.test(n)) return 0.40;
  if (/самбука/.test(n)) return 0.38;
  if (/егермейстер/.test(n)) return 0.35;
  if (/бехеровка/.test(n)) return 0.38;
  if (/фернет/.test(n)) return 0.39;
  if (/амаро/.test(n)) return 0.30;

  if (/сливочный ликер/.test(n)) return 0.17;
  if (/яичный ликер/.test(n)) return 0.15;
  if (
    /(ликер|мараскино|амаретто|трипл сек|куантро|гран маньер|драмбуи|лимончелло|гальяно|фалернум|априкот|кюрасао)/.test(
      n
    )
  )
    return 0.25;

  if (/абсент/.test(n)) return 0.65;
  if (/сверхкрепкий/.test(n)) return 0.60;

  if (
    /(джин|водк|виски|бурбон|скотч|ром\b|кашаса|текил|мескаль|коньяк|бренди|кальвадос|граппа|писко|ржаной)/.test(
      n
    )
  )
    return 0.40;

  return 0;
}

// ─── Sweetness estimation (0 = dry/bitter … 10 = very sweet) ─────────────────

function estimateSweetness(name: string): number {
  const n = name.toLowerCase();

  if (/(сироп|гренадин|мёд\b|мед\b|сахар|сгущ|кордиал|оржат)/.test(n))
    return 9;

  if (
    /(ликер|мараскино|амаретто|трипл сек|куантро|гран маньер|драмбуи|гальяно|априкот|кюрасао|бенедиктин|фалернум|лимончелло|самбука)/.test(
      n
    )
  )
    return 7;

  if (
    /(сок|пюре|вермут россо|красный вермут|вермут бьянко|портвейн|апероль|кола\b|спрайт|арбуз|морожен)/.test(
      n
    )
  )
    return 5;

  if (
    /(молок|сливк|яйц|белок|желток|тоник|содов|пиво|эль|лагер|стаут|энергет|лимонад|газиров|чай|эспрессо|кокосов|морс|вод[аы]\b)/.test(
      n
    )
  )
    return 3;

  if (/(сухой вермут|херес|лиллет|кокки|вино сух|игрист)/.test(n)) return 2;

  if (
    /(биттер|ангостура|кампари|фернет|амаро|сьюз|чинар|абсент|егермейстер|бехеровка|мескаль)/.test(
      n
    )
  )
    return 1;

  if (
    /(джин|водк|виски|бурбон|ром\b|текил|коньяк|бренди|граппа|писко|кашаса|кальвадос|скотч|ржаной)/.test(
      n
    )
  )
    return 2;

  return 4;
}

// ─── Volume helpers ──────────────────────────────────────────────────────────

function toMl(raw: string, unit: string): number {
  const s = raw.replace(",", ".").replace(/[^\d.\-]/g, "");
  let num: number;
  if (s.includes("-")) {
    const [a, b] = s.split("-").map(Number);
    num = ((a || 0) + (b || 0)) / 2;
  } else {
    num = Number(s);
  }
  if (!Number.isFinite(num) || num <= 0) return 0;

  const u = unit.trim().toLowerCase();
  if (u === "мл" || u === "ml") return num;
  if (u.startsWith("дэш") || u.startsWith("даш")) return num * 0.6;
  if (u.startsWith("кап")) return num * 0.05;
  if (u.startsWith("б.л")) return num * 5;
  if (u.startsWith("ч.л")) return num * 5;
  if (u.startsWith("ст.л")) return num * 15;
  if (u.startsWith("шт")) return num * 5;
  if (u.startsWith("гр") || u === "г") return num;
  return 0;
}

function parseAmountParts(amount: string): { raw: string; unit: string } {
  const m = amount.match(/^([\d,.\-\s]+)\s*(.*)$/);
  if (!m) return { raw: "0", unit: "" };
  return { raw: m[1].trim(), unit: m[2].trim() };
}

// ─── Scale calculators ───────────────────────────────────────────────────────

function calcStrength(ingredients: Ingredient[]): number {
  let alcMl = 0;
  let totalMl = 0;
  for (const { name, amount } of ingredients) {
    const { raw, unit } = parseAmountParts(amount);
    const ml = toMl(raw, unit || "мл");
    if (ml <= 0) continue;
    alcMl += ml * estimateABV(name);
    totalMl += ml;
  }
  if (totalMl === 0) return 0;
  const abv = alcMl / totalMl;
  return Math.min(10, Math.max(0, Math.round((abv / 0.4) * 10)));
}

function calcSweetDry(ingredients: Ingredient[]): number {
  let weighted = 0;
  let totalMl = 0;
  for (const { name, amount } of ingredients) {
    const { raw, unit } = parseAmountParts(amount);
    const ml = toMl(raw, unit || "мл");
    if (ml <= 0) continue;
    weighted += ml * estimateSweetness(name);
    totalMl += ml;
  }
  if (totalMl === 0) return 5;
  return Math.min(10, Math.max(0, Math.round(weighted / totalMl)));
}

// ─── xlsx → Recipe[] parser ──────────────────────────────────────────────────

const KNOWN_PROPS = new Set([
  "Бокал",
  "Лёд",
  "Метод",
  "Украшение",
  "Выразить цедру",
  "Примечание",
]);

function cell(row: unknown[], idx: number): string {
  const v = row[idx];
  if (v == null) return "";
  return String(v).trim();
}

function sanitizeIngredientName(raw: string): string {
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Иногда в исходнике встречается артефакт вида "ааТёмный..."
  return cleaned.replace(/^аа(?=[A-ZА-ЯЁ])/u, "");
}

function parseSheet(data: unknown[][]): Recipe[] {
  const recipes: Recipe[] = [];
  let cur: Recipe | null = null;
  let mainCat: string | null = null;
  let subCat: string | null = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const c0 = cell(row, 0);
    const c1 = cell(row, 1);
    const c2 = cell(row, 2);
    const c3 = cell(row, 3);
    const c7 = cell(row, 7);

    if (!c0 && !c1) {
      if (cur) {
        recipes.push(cur);
        cur = null;
      }
      continue;
    }

    const num = Number(c0);
    if (c0 && Number.isInteger(num) && num > 0 && c1) {
      if (cur) recipes.push(cur);
      cur = {
        number: num,
        name: c1,
        ingredients: [],
        glass: null,
        ice: null,
        methods: [],
        garnishes: [],
        expressZest: false,
        notes: null,
        isIBA: c7 === "IBA",
        mainCategory: mainCat,
        subCategory: subCat,
      };
      continue;
    }

    if (c0) continue;

    if (KNOWN_PROPS.has(c1) && cur) {
      if (c1 === "Бокал") cur.glass = c3 || null;
      else if (c1 === "Лёд")
        cur.ice = c3 && c3 !== "Нет" ? c3 : null;
      else if (c1 === "Метод" && c3) cur.methods.push(c3);
      else if (c1 === "Украшение" && c3 && c3 !== "Нет")
        cur.garnishes.push(c3);
      else if (c1 === "Выразить цедру") cur.expressZest = c3 === "Да";
      else if (c1 === "Примечание" && c3) cur.notes = c3;
      continue;
    }

    // Ingredient: c1 is any amount (number, "?", range) AND c2 or c3 present
    if (cur && c1 && !KNOWN_PROPS.has(c1) && (c2 || c3) && c3) {
      const amountStr = c2 ? `${c1} ${c2}` : c1;
      cur.ingredients.push({ name: sanitizeIngredientName(c3), amount: amountStr });
      continue;
    }

    // Category / sub-category header: Cyrillic text, c2+c3 empty, not a property
    const hasCyrillic = /[\u0400-\u04FF]/.test(c1);
    if (
      c1 &&
      hasCyrillic &&
      !c2 &&
      !c3 &&
      c1 !== "Рецепты" &&
      !KNOWN_PROPS.has(c1) &&
      c1.length > 2
    ) {
      if (cur) {
        recipes.push(cur);
        cur = null;
      }
      if (/^С[ое]?\s/.test(c1)) {
        subCat = c1;
      } else {
        mainCat = c1;
        subCat = null;
      }
    }
  }

  if (cur) recipes.push(cur);
  return recipes;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const xlsxPath = path.resolve(process.cwd(), "Рецепты BlackieBar.xlsx");
  console.log(`Чтение: ${xlsxPath}`);

  const wb = XLSX.readFile(xlsxPath);
  console.log(`Листы: ${wb.SheetNames.join(", ")}`);

  const sheetName =
    wb.SheetNames.find((s) => /рецепт/i.test(s)) ?? wb.SheetNames[0];
  console.log(`Используем лист: "${sheetName}"`);

  const raw = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
  });

  const recipes = parseSheet(raw as unknown[][]);
  console.log(`Распарсено: ${recipes.length} рецептов\n`);

  for (const r of recipes.slice(0, 5)) {
    console.log(
      `  #${r.number} "${r.name}"  [${r.mainCategory} / ${r.subCategory}]  IBA=${r.isIBA}  ing=${r.ingredients.length}  str=${calcStrength(r.ingredients)}  sweet=${calcSweetDry(r.ingredients)}`
    );
  }

  // ── Categories ────────────────────────────────────────────────────────────

  const cats = [
    ...new Set(recipes.map((r) => r.mainCategory).filter(Boolean)),
  ] as string[];
  console.log(`\nКатегории (${cats.length}): ${cats.join("; ")}`);

  for (let i = 0; i < cats.length; i++) {
    await pool.query(
      `INSERT INTO cocktail_categories (name, slug, sort_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING`,
      [cats[i], slugify(cats[i]), (i + 1) * 10]
    );
  }

  const { rows: catRows } = await pool.query(
    `SELECT id, slug FROM cocktail_categories`
  );
  const catMap = new Map<string, number>(
    catRows.map((r: { id: number; slug: string }) => [r.slug, r.id])
  );

  // ── Insert cocktails ──────────────────────────────────────────────────────

  const socialJson = JSON.stringify(SOCIAL_LINKS);
  let inserted = 0;
  let skipped = 0;
  const usedSlugs = new Set<string>();

  for (const r of recipes) {
    let base = slugify(r.name) || `cocktail-${r.number}`;
    let slug = base;
    let sfx = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${sfx++}`;
    }
    usedSlugs.add(slug);

    const garnishItems = r.garnishes.map((g) => {
      if (r.expressZest && /цедр/i.test(g)) return `${g} (выразить)`;
      return g;
    });
    let garnish = garnishItems.join(", ") || null;
    if (r.expressZest && garnish && !/выразить/i.test(garnish)) {
      garnish += " (выразить цедру)";
    } else if (r.expressZest && !garnish) {
      garnish = "Выразить цедру";
    }

    const method = r.methods.join(" + ") || null;
    const ingredientsJson = JSON.stringify(
      r.ingredients.map(({ name, amount }) => ({ name, amount }))
    );

    const tags: string[] = [];
    if (r.mainCategory) tags.push(r.mainCategory);
    if (r.subCategory) tags.push(r.subCategory);
    if (r.isIBA) tags.push("IBA");

    const categoryId = r.mainCategory
      ? catMap.get(slugify(r.mainCategory)) ?? null
      : null;

    try {
      const res = await pool.query(
        `INSERT INTO cocktails (
           name, slug, category_id, description, method, glass, garnish, ice,
           ingredients, instructions, cordials_recipe,
           bar_name, bar_city, bar_description, author,
           social_links, flavor_profile, tags, image_url, gallery_urls,
           is_classic, is_published,
           strength_scale, taste_sweet_dry_scale,
           history, allergens, nutrition_note, alcohol_content_note
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,
           $9::jsonb,$10,$11,
           $12,$13,$14,$15,
           $16::jsonb,$17::jsonb,$18,$19,$20::jsonb,
           $21,$22,
           $23,$24,
           $25,$26,$27,$28
         ) ON CONFLICT (slug) DO NOTHING`,
        [
          r.name,
          slug,
          categoryId,
          null,
          method,
          r.glass,
          garnish,
          r.ice,
          ingredientsJson,
          r.notes,
          null,
          AUTHOR,
          null,
          null,
          AUTHOR,
          socialJson,
          "{}",
          tags,
          null,
          "[]",
          r.isIBA,
          true,
          calcStrength(r.ingredients),
          calcSweetDry(r.ingredients),
          null,
          null,
          null,
          null,
        ]
      );
      if (res.rowCount && res.rowCount > 0) inserted++;
      else skipped++;
    } catch (err) {
      console.error(
        `Ошибка #${r.number} "${r.name}":`,
        (err as Error).message
      );
    }
  }

  console.log(`\nВставлено: ${inserted}, пропущено (дубли slug): ${skipped}`);

  const {
    rows: [{ count }],
  } = await pool.query(`SELECT COUNT(*) FROM cocktails WHERE author = $1`, [
    AUTHOR,
  ]);
  console.log(`Всего рецептов BlackieBar в БД: ${count}`);
}

main()
  .then(() => console.log("\nSeed завершён."))
  .catch((err) => {
    console.error("Критическая ошибка:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
