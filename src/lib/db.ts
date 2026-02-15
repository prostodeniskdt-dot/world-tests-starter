import "server-only";
import { Pool } from "pg";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Add it to .env.local (local) or hosting project settings.`
    );
  }
  return v;
}

const pool = new Pool({
  connectionString: required("DATABASE_URL"),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export { pool as db };
