/**
 * Нормализация legacy-тестов в БД: конвертация механик и answerKey.
 *
 *   npx tsx scripts/normalize-tests-db.ts           # dry-run (по умолчанию)
 *   npx tsx scripts/normalize-tests-db.ts --apply     # запись в БД
 *   npx tsx scripts/normalize-tests-db.ts --apply --backup=exports/tests-backup.json
 */
import "./register-server-only-shim";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import * as fs from "fs";
import { db } from "../src/lib/db";
import { normalizeTestImport } from "../src/lib/test-import/normalize";
import { validateTestPayload } from "../src/lib/test-schema";

const apply = process.argv.includes("--apply");
const backupArg = process.argv.find((a) => a.startsWith("--backup="));
const backupPath =
  backupArg?.slice("--backup=".length) ??
  path.join("exports", `tests-backup-${Date.now()}.json`);

async function main() {
  const { rows } = await db.query(
    `SELECT id, title, description, category, author, difficulty_level, base_points, max_attempts,
            questions, answer_key, is_published
     FROM tests ORDER BY id`
  );

  const backup = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    author: r.author,
    difficulty_level: r.difficulty_level,
    base_points: r.base_points,
    max_attempts: r.max_attempts,
    questions: r.questions,
    answer_key: r.answer_key,
    is_published: r.is_published,
  }));

  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Backup written: ${backupPath} (${rows.length} tests)`);

  let changed = 0;
  let errors = 0;

  for (const row of rows) {
    const raw = {
      title: row.title,
      description: row.description,
      category: row.category,
      author: row.author,
      difficultyLevel: row.difficulty_level,
      basePoints: row.base_points,
      maxAttempts: row.max_attempts,
      questions: row.questions,
      answerKey: row.answer_key,
    };

    const { payload, warnings } = normalizeTestImport(raw as Record<string, unknown>);
    const validation = validateTestPayload(payload);
    const validationErrors = validation.issues.filter((i) => i.severity === "error");

    if (validationErrors.length > 0) {
      errors += validationErrors.length;
      console.log(`\n[SKIP ${row.id}] ${row.title} — validation errors:`);
      for (const e of validationErrors) console.log(`  ${e.path}: ${e.message}`);
      continue;
    }

    const questionsChanged =
      JSON.stringify(row.questions) !== JSON.stringify(payload.questions);
    const keyChanged =
      JSON.stringify(row.answer_key) !== JSON.stringify(payload.answerKey);

    if (!questionsChanged && !keyChanged && warnings.length === 0) continue;

    changed += 1;
    console.log(`\n[${apply ? "APPLY" : "DRY"} ${row.id}] ${row.title}`);
    for (const w of warnings) console.log(`  warn ${w.path}: ${w.message}`);

    if (apply) {
      await db.query(
        `UPDATE tests SET questions = $1, answer_key = $2, updated_at = now() WHERE id = $3`,
        [JSON.stringify(payload.questions), JSON.stringify(payload.answerKey), row.id]
      );
    }
  }

  console.log(
    `\nDone. Tests: ${rows.length}, to normalize: ${changed}, validation errors: ${errors}, mode: ${apply ? "APPLY" : "DRY-RUN"}`
  );
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
