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

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: required("DATABASE_URL"),
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

/** Пул подключений к БД. Инициализация отложена до первого запроса — сборка Next.js не требует DATABASE_URL. */
export const db = {
  query: (...args: Parameters<Pool["query"]>) => getPool().query(...args),
};
