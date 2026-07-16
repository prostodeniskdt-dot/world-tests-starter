/**
 * Полная пересборка flavor_pairings из PDF и энциклопедии.
 * Удаляет английские и битые названия, оставляет только русские пары.
 *
 * npm run rebuild-flavor-pairings
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { parseFlavorPairings } from "./parse-flavor-pairings";
import { parseAllEncyclopediaFiles } from "./parse-flavor-encyclopedia";
import {
  extractRussianIngredient,
  normalizeIngredientForm,
} from "../src/lib/ingredient-normalize";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL не найден");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

type Pair = { main: string; paired: string; category: string };

function inferCategory(groupOrMain: string): "fruits" | "herbs_spices" | "other" {
  const g = groupOrMain.toLowerCase();
  if (/цитрус|фрукт|ягод|тропическ|косточков|бахчев/.test(g)) return "fruits";
  if (/трав|специ|пряност|цвет|лист/.test(g)) return "herbs_spices";
  return "other";
}

function collectPdfPairs(): Pair[] {
  const rawPath = path.join(__dirname, "tablica-sochetaniya-raw.txt");
  if (!fs.existsSync(rawPath)) {
    console.log("  PDF raw не найден, пропуск");
    return [];
  }
  const raw = fs.readFileSync(rawPath, "utf-8");
  const parsed = parseFlavorPairings(raw);
  const pairs: Pair[] = [];

  for (const { mainIngredient, pairedIngredients, category } of parsed) {
    const main = extractRussianIngredient(mainIngredient, null);
    if (!main) continue;
    for (const p of pairedIngredients) {
      const paired = extractRussianIngredient(p, null);
      if (!paired || paired === main) continue;
      pairs.push({ main, paired, category });
    }
  }
  return pairs;
}

function collectEncyclopediaPairs(): Pair[] {
  const entries = parseAllEncyclopediaFiles(path.join(process.cwd(), "baza"));
  const pairs: Pair[] = [];
  for (const e of entries) {
    const main = normalizeIngredientForm(e.ingredient1);
    const paired = normalizeIngredientForm(e.ingredient2);
    if (!main || !paired || main === paired) continue;
    pairs.push({
      main,
      paired,
      category: inferCategory(e.group1 ?? ""),
    });
  }
  return pairs;
}

async function main() {
  console.log("=== Пересборка flavor_pairings ===\n");

  const pdfPairs = collectPdfPairs();
  console.log(`PDF: ${pdfPairs.length} пар`);

  const encPairs = collectEncyclopediaPairs();
  console.log(`Энциклопедия: ${encPairs.length} пар`);

  const allPairs = [...pdfPairs, ...encPairs];
  const unique = new Map<string, Pair>();

  for (const pair of allPairs) {
    unique.set(`${pair.main}::${pair.paired}`, pair);
    // Обратная связь — только если оба русские (уже проверено)
    unique.set(`${pair.paired}::${pair.main}`, {
      main: pair.paired,
      paired: pair.main,
      category: inferCategory(pair.paired),
    });
  }

  console.log(`Уникальных записей для вставки: ${unique.size}`);

  await pool.query("DELETE FROM flavor_pairings");
  console.log("Старые данные удалены");

  let inserted = 0;
  for (const pair of unique.values()) {
    const res = await pool.query(
      `INSERT INTO flavor_pairings (main_ingredient, paired_ingredient, main_category)
       VALUES ($1, $2, $3)
       ON CONFLICT (main_ingredient, paired_ingredient) DO NOTHING`,
      [pair.main, pair.paired, pair.category]
    );
    if (res.rowCount && res.rowCount > 0) inserted++;
  }

  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(DISTINCT main_ingredient)::int AS mains
     FROM flavor_pairings`
  );

  console.log(`\n✅ Вставлено: ${inserted}`);
  console.log(`Итого в БД: ${rows[0].total} пар, ${rows[0].mains} ингредиентов`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());
