import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const cols = await client.query(
    `
      select column_name, is_nullable, data_type
      from information_schema.columns
      where table_schema='public' and table_name='cocktails'
        and column_name in ('slug','name','classic_original_author','ingredients')
      order by column_name;
    `
  );
  console.log("cocktails columns:", cols.rows);

  const constraints = await client.query(
    `
      select conname, pg_get_constraintdef(c.oid) as def
      from pg_constraint c
      join pg_class t on t.oid=c.conrelid
      join pg_namespace n on n.oid=t.relnamespace
      where n.nspname='public' and t.relname='cocktails'
      order by conname;
    `
  );
  console.log("cocktails constraints:", constraints.rows);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

