import assert from "node:assert/strict";
import test from "node:test";
import {
  NAVIGATION_GROUPS,
  SECTIONS,
  isNavigationItemActive,
} from "../src/lib/sections";

test("section identifiers and paths are unique", () => {
  const ids = SECTIONS.map((section) => section.id);
  const paths = SECTIONS.map((section) => section.href);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(paths).size, paths.length);
});

test("all content sections occur exactly once in primary content groups", () => {
  const contentGroups = NAVIGATION_GROUPS.filter((group) =>
    ["learn", "practice", "reference"].includes(group.id)
  );
  const groupedSectionIds = contentGroups.flatMap((group) =>
    group.items.flatMap((item) => (item.sectionId ? [item.sectionId] : []))
  );
  assert.deepEqual(
    [...groupedSectionIds].sort(),
    SECTIONS.map((section) => section.id).sort()
  );
});

test("navigation groups and item identifiers are unique", () => {
  const groupIds = NAVIGATION_GROUPS.map((group) => group.id);
  const itemIds = NAVIGATION_GROUPS.flatMap((group) =>
    group.items.map((item) => item.id)
  );
  assert.equal(new Set(groupIds).size, groupIds.length);
  assert.equal(new Set(itemIds).size, itemIds.length);
});

test("active navigation handles nested paths, anchors and boundaries", () => {
  assert.equal(isNavigationItemActive("/tests", "/tests"), true);
  assert.equal(isNavigationItemActive("/tests/history", "/tests"), true);
  assert.equal(isNavigationItemActive("/test", "/tests"), true);
  assert.equal(isNavigationItemActive("/tests", "/tests#leaderboard"), true);
  assert.equal(isNavigationItemActive("/testing", "/tests"), false);
  assert.equal(isNavigationItemActive("/", "/"), true);
  assert.equal(isNavigationItemActive("/knowledge", "/"), false);
});
