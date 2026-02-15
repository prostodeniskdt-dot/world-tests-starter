import "server-only";
import { Pool, type QueryResult } from "pg";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Add it to .env.local (local) or hosting project settings.`
    );
  }
  return v;
}

const isRetryableError = (err: unknown): boolean => {
  const msg = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
  const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "";
  return msg === "EAI_AGAIN" || msg === "ENOTFOUND" || message.includes("getaddrinfo EAI_AGAIN");
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: required("DATABASE_URL"),
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15000,
    });
  }
  return pool;
}

async function queryWithRetry(
  queryText: string,
  values?: unknown[],
  attempt = 1
): Promise<QueryResult> {
  const maxAttempts = 3;
  try {
    return await getPool().query(queryText, values);
  } catch (err) {
    if (attempt < maxAttempts && isRetryableError(err)) {
      await sleep(1000 * attempt);
      return queryWithRetry(queryText, values, attempt + 1);
    }
    throw err;
  }
}

/** Пул подключений к БД. Инициализация отложена до первого запроса — сборка Next.js не требует DATABASE_URL. */
export const db = {
  query(...args: [queryText: string, values?: unknown[]]): Promise<QueryResult> {
    return queryWithRetry(args[0], args[1]);
  },
};
