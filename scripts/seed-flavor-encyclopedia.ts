/**
 * Импорт энциклопедии сочетаний из baza/*.xlsx в PostgreSQL.
 *
 * Использование: npm run seed-flavor-encyclopedia
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import {
  ENCYCLOPEDIA_PARTS,
  parseAllEncyclopediaFiles,
  type ParsedEncyclopediaEntry,
} from "./parse-flavor-encyclopedia";

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

function inferLegacyCategory(
  group: string | null
): "fruits" | "herbs_spices" | "other" {
  if (!group) return "other";
  const g = group.toLowerCase();
  if (
    /цитрус|фрукт|ягод|тропическ|косточков|бахчев/.test(g)
  )
    return "fruits";
  if (/трав|специ|пряност|цвет|лист/.test(g)) return "herbs_spices";
  return "other";
}

async function upsertPart(
  part: (typeof ENCYCLOPEDIA_PARTS)[number],
  count: number
): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO flavor_encyclopedia_parts (slug, title, description, sort_order, pairings_count)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       sort_order = EXCLUDED.sort_order,
       pairings_count = EXCLUDED.pairings_count
     RETURNING id`,
    [part.slug, part.title, part.description, part.sortOrder, count]
  );
  return rows[0].id as number;
}

async function insertEntry(
  partId: number,
  entry: ParsedEncyclopediaEntry
): Promise<boolean> {
  const res = await pool.query(
    `INSERT INTO flavor_encyclopedia_entries (
       external_id, part_id, main_section, section_key,
       base_ingredient, ingredient_1, ingredient_2,
       original_1, original_2, group_1, group_2,
       aroma_profile_1, aroma_profile_2, compounds_1, compounds_2,
       mechanism_type, explanation, processing, critical_points,
       practical_application, confidence, sources, pages
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
     )
     ON CONFLICT (part_id, external_id) DO UPDATE SET
       main_section = EXCLUDED.main_section,
       section_key = EXCLUDED.section_key,
       base_ingredient = EXCLUDED.base_ingredient,
       ingredient_1 = EXCLUDED.ingredient_1,
       ingredient_2 = EXCLUDED.ingredient_2,
       original_1 = EXCLUDED.original_1,
       original_2 = EXCLUDED.original_2,
       group_1 = EXCLUDED.group_1,
       group_2 = EXCLUDED.group_2,
       aroma_profile_1 = EXCLUDED.aroma_profile_1,
       aroma_profile_2 = EXCLUDED.aroma_profile_2,
       compounds_1 = EXCLUDED.compounds_1,
       compounds_2 = EXCLUDED.compounds_2,
       mechanism_type = EXCLUDED.mechanism_type,
       explanation = EXCLUDED.explanation,
       processing = EXCLUDED.processing,
       critical_points = EXCLUDED.critical_points,
       practical_application = EXCLUDED.practical_application,
       confidence = EXCLUDED.confidence,
       sources = EXCLUDED.sources,
       pages = EXCLUDED.pages`,
    [
      entry.externalId,
      partId,
      entry.mainSection,
      entry.sectionKey,
      entry.baseIngredient,
      entry.ingredient1,
      entry.ingredient2,
      entry.original1,
      entry.original2,
      entry.group1,
      entry.group2,
      entry.aromaProfile1,
      entry.aromaProfile2,
      entry.compounds1,
      entry.compounds2,
      entry.mechanismType,
      entry.explanation,
      entry.processing,
      entry.criticalPoints,
      entry.practicalApplication,
      entry.confidence,
      entry.sources,
      entry.pages,
    ]
  );
  return (res.rowCount ?? 0) > 0;
}

async function mergeIntoLegacyPairings(
  entries: ParsedEncyclopediaEntry[]
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  const seen = new Set<string>();

  for (const entry of entries) {
    const main = entry.ingredient1.trim();
    const paired = entry.ingredient2.trim();
    if (!main || !paired) continue;

    const key = `${main.toLowerCase()}::${paired.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const category = inferLegacyCategory(entry.group1);

    try {
      const res = await pool.query(
        `INSERT INTO flavor_pairings (main_ingredient, paired_ingredient, main_category)
         VALUES ($1, $2, $3)
         ON CONFLICT (main_ingredient, paired_ingredient) DO NOTHING`,
        [main, paired, category]
      );
      if (res.rowCount && res.rowCount > 0) inserted++;
      else skipped++;
    } catch (err) {
      console.error(`  Ошибка legacy ${main}+${paired}:`, (err as Error).message);
    }

    // Обратная пара для поиска
    const revKey = `${paired.toLowerCase()}::${main.toLowerCase()}`;
    if (!seen.has(revKey)) {
      seen.add(revKey);
      const revCategory = inferLegacyCategory(entry.group2);
      try {
        const res = await pool.query(
          `INSERT INTO flavor_pairings (main_ingredient, paired_ingredient, main_category)
           VALUES ($1, $2, $3)
           ON CONFLICT (main_ingredient, paired_ingredient) DO NOTHING`,
          [paired, main, revCategory]
        );
        if (res.rowCount && res.rowCount > 0) inserted++;
        else skipped++;
      } catch {
        /* ignore */
      }
    }
  }

  return { inserted, skipped };
}

async function main() {
  const bazaDir = path.join(process.cwd(), "baza");
  console.log("Импорт энциклопедии из", bazaDir);

  const byPart = new Map<string, ParsedEncyclopediaEntry[]>();
  for (const part of ENCYCLOPEDIA_PARTS) {
    byPart.set(part.slug, []);
  }

  const allEntries = parseAllEncyclopediaFiles(bazaDir);
  for (const entry of allEntries) {
    const list = byPart.get(entry.partSlug);
    if (list) list.push(entry);
  }

  console.log("\n--- Запись частей ---");
  const partIds = new Map<string, number>();
  for (const part of ENCYCLOPEDIA_PARTS) {
    const entries = byPart.get(part.slug) ?? [];
    const partId = await upsertPart(part, entries.length);
    partIds.set(part.slug, partId);
    console.log(`  ${part.title}: ${entries.length} записей (id=${partId})`);
  }

  console.log("\n--- Запись сочетаний ---");
  let totalInserted = 0;
  for (const part of ENCYCLOPEDIA_PARTS) {
    const partId = partIds.get(part.slug)!;
    const entries = byPart.get(part.slug) ?? [];
    let count = 0;
    for (const entry of entries) {
      if (await insertEntry(partId, entry)) count++;
    }
    totalInserted += count;
    console.log(`  ${part.title}: ${count} upsert`);
  }

  console.log("\n--- Слияние с flavor_pairings ---");
  const { inserted, skipped } = await mergeIntoLegacyPairings(allEntries);
  console.log(`  Новых пар: ${inserted}, пропущено (дубли): ${skipped}`);

  console.log(`\n✅ Готово. Энциклопедия: ${totalInserted} записей.`);
}

main()
  .catch((err) => {
    console.error("Ошибка:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
