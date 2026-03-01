/**
 * Заполняет таблицу flavor_pairings данными из PDF "Таблица сочетания".
 * Использует парсер из parse-flavor-pairings.ts.
 *
 * Использование: npm run seed-flavor-pairings
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { parseFlavorPairings } from "./parse-flavor-pairings";

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

async function main() {
  const rawPath = path.join(__dirname, "tablica-sochetaniya-raw.txt");
  let raw: string;
  try {
    raw = fs.readFileSync(rawPath, "utf-8");
  } catch {
    console.error(`Файл не найден: ${rawPath}`);
    console.error(
      "Убедитесь, что tablica-sochetaniya-raw.txt существует (копия текста из PDF)."
    );
    process.exit(1);
  }

  const parsed = parseFlavorPairings(raw);
  console.log(`Загружено ${parsed.length} основных ингредиентов`);

  let inserted = 0;
  let skipped = 0;

  for (const { mainIngredient, pairedIngredients, category } of parsed) {
    for (const paired of pairedIngredients) {
      const p = paired.trim();
      if (!p) continue;
      try {
        const res = await pool.query(
          `INSERT INTO flavor_pairings (main_ingredient, paired_ingredient, main_category)
           VALUES ($1, $2, $3)
           ON CONFLICT (main_ingredient, paired_ingredient) DO NOTHING`,
          [mainIngredient, p, category]
        );
        if (res.rowCount && res.rowCount > 0) inserted++;
        else skipped++;
      } catch (err) {
        console.error(
          `Ошибка вставки ${mainIngredient} + ${p}:`,
          (err as Error).message
        );
      }
    }
  }

  console.log(`Вставлено: ${inserted}, пропущено (дубли): ${skipped}`);
}

main()
  .then(() => {
    console.log("Seed завершён.");
  })
  .catch((err) => {
    console.error("Ошибка:", err);
    process.exit(1);
  })
  .finally(() => pool.end());
