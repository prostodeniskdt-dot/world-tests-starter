/**
 * Аудит ингредиентов в flavor_pairings и encyclopedia.
 * npm run audit-ingredients
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { parseAllEncyclopediaFiles } from "./parse-flavor-encyclopedia";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const CYR = /[а-яА-ЯёЁ]/;

function hasCyrillic(s: string): boolean {
  return CYR.test(s);
}

async function main() {
  console.log("=== flavor_pairings ===");
  const { rows: totals } = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(DISTINCT main_ingredient)::int AS mains
     FROM flavor_pairings`
  );
  console.log(totals[0]);

  const { rows: nonRu } = await pool.query(
    `SELECT main_ingredient, COUNT(*)::int AS cnt
     FROM flavor_pairings
     WHERE main_ingredient !~ '[а-яА-ЯёЁ]'
     GROUP BY main_ingredient
     ORDER BY cnt DESC
     LIMIT 15`
  );
  console.log("\nNon-Cyrillic main ingredients (top 15):");
  nonRu.forEach((r) => console.log(`  ${r.cnt}\t${r.main_ingredient}`));

  const { rows: weird } = await pool.query(
    `SELECT DISTINCT main_ingredient FROM flavor_pairings
     WHERE main_ingredient ~ '[!$;]' OR main_ingredient ~ 'cii'
     LIMIT 20`
  );
  console.log("\nGarbled mains:", weird.map((r) => r.main_ingredient));

  console.log("\n=== encyclopedia source ===");
  const entries = parseAllEncyclopediaFiles(path.join(process.cwd(), "baza"));
  const bad1 = entries.filter((e) => !hasCyrillic(e.ingredient1));
  const bad2 = entries.filter((e) => !hasCyrillic(e.ingredient2));
  const weirdE = entries.filter((e) =>
    /[!$;]|cii|'ii/.test(`${e.ingredient1} ${e.ingredient2}`)
  );
  console.log(`Total entries: ${entries.length}`);
  console.log(`ingredient1 without Cyrillic: ${bad1.length}`);
  console.log(`ingredient2 without Cyrillic: ${bad2.length}`);
  console.log(`Weird text: ${weirdE.length}`);
  console.log(
    "Sample EN ingredient1:",
    bad1.slice(0, 5).map((e) => ({
      i1: e.ingredient1,
      i2: e.ingredient2,
      o1: e.original1,
      o2: e.original2,
    }))
  );
  console.log(
    "Sample weird:",
    weirdE.slice(0, 5).map((e) => [e.ingredient1, e.ingredient2])
  );
}

main()
  .catch(console.error)
  .finally(() => pool.end());
