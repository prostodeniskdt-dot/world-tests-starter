import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dbMigrationPath = resolve(
  process.cwd(),
  "db/migrations/20260712_best_score_points_season.sql"
);
const supabaseMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260712_best_score_points_season.sql"
);
const migration = readFileSync(dbMigrationPath, "utf8");

test("points migration credits only improvement over the seasonal best", () => {
  assert.match(migration, /max\(a\.points_awarded\)/i);
  assert.match(
    migration,
    /greatest\(0,\s*p_points_awarded\s*-\s*v_previous_best\)/i
  );
  assert.match(migration, /a\.season_id\s*=\s*v_season_id/i);
  assert.doesNotMatch(
    migration,
    /order by attempts\.created_at desc\s+limit 1/i
  );
});

test("points migration keeps an auditable credited delta", () => {
  assert.match(migration, /points_credited/i);
  assert.match(migration, /perform 1 from public\.users.*for update/is);
});

test("database and Supabase scoring migrations stay identical", () => {
  assert.equal(readFileSync(supabaseMigrationPath, "utf8"), migration);
});
