/**
 * Dry-run аудит тестов в БД: legacy-типы, отсутствующие answerKey, select-errors.
 * Запуск: npx tsx scripts/audit-tests-db.ts
 */
import "./register-server-only-shim";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import { db } from "../src/lib/db";
import { normalizeTestImport } from "../src/lib/test-import/normalize";
import { validateTestPayload } from "../src/lib/test-schema";

async function main() {
  const { rows } = await db.query(`SELECT id, title, questions, answer_key FROM tests ORDER BY id`);
  let issueCount = 0;

  for (const row of rows) {
    const raw = {
      title: row.title,
      questions: row.questions,
      answerKey: row.answer_key,
    };
    const { payload, warnings } = normalizeTestImport(raw as Record<string, unknown>);
    const validation = validateTestPayload(payload);

    const errors = [...warnings, ...validation.issues.filter((i) => i.severity === "error")];
    if (errors.length > 0) {
      issueCount += errors.length;
      console.log(`\n[${row.id}] ${row.title}`);
      for (const e of errors) {
        console.log(`  - ${e.path}: ${e.message}`);
      }
    }
  }

  console.log(`\nAudit complete. Tests: ${rows.length}, issues: ${issueCount}`);
  process.exit(issueCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
