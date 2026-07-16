/** Удаляет устаревшие записи энциклопедии без повторного импорта */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { ENCYCLOPEDIA_PARTS, parseAllEncyclopediaFiles } from "./parse-flavor-encyclopedia";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function main() {
  const byPart = new Map<string, string[]>();
  for (const part of ENCYCLOPEDIA_PARTS) byPart.set(part.slug, []);

  for (const entry of parseAllEncyclopediaFiles(path.join(process.cwd(), "baza"))) {
    byPart.get(entry.partSlug)?.push(entry.externalId);
  }

  let totalDeleted = 0;
  for (const part of ENCYCLOPEDIA_PARTS) {
    const ids = byPart.get(part.slug) ?? [];
    const { rows } = await pool.query(
      `SELECT id FROM flavor_encyclopedia_parts WHERE slug = $1`,
      [part.slug]
    );
    if (!rows[0]) continue;
    const partId = rows[0].id as number;
    const del = await pool.query(
      `DELETE FROM flavor_encyclopedia_entries
       WHERE part_id = $1 AND NOT (external_id = ANY($2::text[]))`,
      [partId, ids]
    );
    totalDeleted += del.rowCount ?? 0;
  }

  const { rows } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE ingredient_1 !~ '[а-яА-ЯёЁ]' OR ingredient_2 !~ '[а-яА-ЯёЁ]')::int AS bad,
            COUNT(*)::int AS total
     FROM flavor_encyclopedia_entries`
  );
  console.log(`Удалено устаревших: ${totalDeleted}`);
  console.log(`Энциклопедия: ${rows[0].total} записей, без кириллицы: ${rows[0].bad}`);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
