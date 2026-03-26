import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const statsSql = `
    select
      count(*) as cocktails_total,
      count(*) filter (where jsonb_typeof(ingredients) = 'array') as ingredients_is_array,
      count(*) filter (where ingredients != '[]'::jsonb) as ingredients_not_empty,
      count(*) filter (
        where exists (
          select 1
          from jsonb_array_elements(ingredients) e
          where coalesce(e->>'name','') != ''
        )
      ) as has_any_name
    from cocktails;
  `;
  const stats = await client.query(statsSql);
  console.log("STATS", stats.rows[0]);

  const sampleElemSql = `
    select e
    from cocktails c
    cross join lateral jsonb_array_elements(c.ingredients) e
    where c.ingredients != '[]'::jsonb
    limit 10;
  `;
  const sampleElems = await client.query(sampleElemSql);
  console.log("SAMPLE_E", sampleElems.rows.map((r) => r.e));

  const samplePairsSql = `
    select elem->>'amount' as amount, elem->>'name' as name
    from cocktails c, jsonb_array_elements(c.ingredients) as elem
    where c.ingredients != '[]'::jsonb
    limit 20;
  `;
  const samplePairs = await client.query(samplePairsSql);
  console.log("AMOUNT_NAME", samplePairs.rows);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

