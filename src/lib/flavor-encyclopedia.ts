import "server-only";
import { db } from "./db";

export type EncyclopediaSectionKey =
  | "drinks"
  | "food"
  | "desserts"
  | "sauces"
  | "universal"
  | "other";

export type EncyclopediaPart = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  pairingsCount: number;
};

export type EncyclopediaEntryListItem = {
  id: number;
  externalId: string;
  partSlug: string;
  partTitle: string;
  mainSection: string;
  sectionKey: EncyclopediaSectionKey;
  ingredient1: string;
  ingredient2: string;
  group1: string | null;
  group2: string | null;
  confidence: string | null;
  practicalApplication: string | null;
};

export type EncyclopediaEntryDetail = EncyclopediaEntryListItem & {
  baseIngredient: string | null;
  original1: string | null;
  original2: string | null;
  aromaProfile1: string | null;
  aromaProfile2: string | null;
  compounds1: string | null;
  compounds2: string | null;
  mechanismType: string | null;
  explanation: string | null;
  processing: string | null;
  criticalPoints: string | null;
  sources: string | null;
  pages: string | null;
};

export const SECTION_LABELS: Record<EncyclopediaSectionKey, string> = {
  drinks: "Напитки",
  food: "Еда",
  desserts: "Десерты и выпечка",
  sauces: "Соусы и маринады",
  universal: "Универсальные",
  other: "Прочее",
};

function mapPart(row: Record<string, unknown>): EncyclopediaPart {
  return {
    id: row.id as number,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    sortOrder: row.sort_order as number,
    pairingsCount: row.pairings_count as number,
  };
}

function mapListItem(row: Record<string, unknown>): EncyclopediaEntryListItem {
  return {
    id: row.id as number,
    externalId: row.external_id as string,
    partSlug: row.part_slug as string,
    partTitle: row.part_title as string,
    mainSection: row.main_section as string,
    sectionKey: row.section_key as EncyclopediaSectionKey,
    ingredient1: row.ingredient_1 as string,
    ingredient2: row.ingredient_2 as string,
    group1: (row.group_1 as string | null) ?? null,
    group2: (row.group_2 as string | null) ?? null,
    confidence: (row.confidence as string | null) ?? null,
    practicalApplication:
      (row.practical_application as string | null) ?? null,
  };
}

function mapDetail(row: Record<string, unknown>): EncyclopediaEntryDetail {
  return {
    ...mapListItem(row),
    baseIngredient: (row.base_ingredient as string | null) ?? null,
    original1: (row.original_1 as string | null) ?? null,
    original2: (row.original_2 as string | null) ?? null,
    aromaProfile1: (row.aroma_profile_1 as string | null) ?? null,
    aromaProfile2: (row.aroma_profile_2 as string | null) ?? null,
    compounds1: (row.compounds_1 as string | null) ?? null,
    compounds2: (row.compounds_2 as string | null) ?? null,
    mechanismType: (row.mechanism_type as string | null) ?? null,
    explanation: (row.explanation as string | null) ?? null,
    processing: (row.processing as string | null) ?? null,
    criticalPoints: (row.critical_points as string | null) ?? null,
    sources: (row.sources as string | null) ?? null,
    pages: (row.pages as string | null) ?? null,
  };
}

const ENTRY_SELECT = `
  e.id, e.external_id, e.main_section, e.section_key,
  e.base_ingredient, e.ingredient_1, e.ingredient_2,
  e.original_1, e.original_2, e.group_1, e.group_2,
  e.aroma_profile_1, e.aroma_profile_2, e.compounds_1, e.compounds_2,
  e.mechanism_type, e.explanation, e.processing, e.critical_points,
  e.practical_application, e.confidence, e.sources, e.pages,
  p.slug AS part_slug, p.title AS part_title
`;

export async function getEncyclopediaParts(): Promise<EncyclopediaPart[]> {
  const { rows } = await db.query(
    `SELECT id, slug, title, description, sort_order, pairings_count
     FROM flavor_encyclopedia_parts
     ORDER BY sort_order, title`
  );
  return rows.map(mapPart);
}

export async function getEncyclopediaPartBySlug(
  slug: string
): Promise<EncyclopediaPart | null> {
  const { rows } = await db.query(
    `SELECT id, slug, title, description, sort_order, pairings_count
     FROM flavor_encyclopedia_parts WHERE slug = $1`,
    [slug]
  );
  if (rows.length === 0) return null;
  return mapPart(rows[0]);
}

export async function getEncyclopediaEntries(options: {
  partSlug: string;
  sectionKey?: EncyclopediaSectionKey | null;
  query?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ entries: EncyclopediaEntryListItem[]; total: number }> {
  const { partSlug, sectionKey, query, limit = 50, offset = 0 } = options;

  const conditions = ["p.slug = $1"];
  const params: unknown[] = [partSlug];
  let paramIdx = 2;

  if (sectionKey) {
    conditions.push(`e.section_key = $${paramIdx++}`);
    params.push(sectionKey);
  }

  if (query?.trim()) {
    conditions.push(
      `(LOWER(e.ingredient_1) LIKE $${paramIdx} OR LOWER(e.ingredient_2) LIKE $${paramIdx} OR LOWER(e.external_id) LIKE $${paramIdx})`
    );
    params.push(`%${query.trim().toLowerCase()}%`);
    paramIdx++;
  }

  const where = conditions.join(" AND ");

  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM flavor_encyclopedia_entries e
     JOIN flavor_encyclopedia_parts p ON p.id = e.part_id
     WHERE ${where}`,
    params
  );

  const { rows } = await db.query(
    `SELECT ${ENTRY_SELECT}
     FROM flavor_encyclopedia_entries e
     JOIN flavor_encyclopedia_parts p ON p.id = e.part_id
     WHERE ${where}
     ORDER BY e.ingredient_1, e.ingredient_2
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset]
  );

  return {
    entries: rows.map(mapListItem),
    total: countRes.rows[0].total as number,
  };
}

export async function getEncyclopediaEntryById(
  id: number
): Promise<EncyclopediaEntryDetail | null> {
  const { rows } = await db.query(
    `SELECT ${ENTRY_SELECT}
     FROM flavor_encyclopedia_entries e
     JOIN flavor_encyclopedia_parts p ON p.id = e.part_id
     WHERE e.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  return mapDetail(rows[0]);
}

export async function getEncyclopediaEntriesForIngredient(
  ingredient: string,
  limit = 30
): Promise<EncyclopediaEntryListItem[]> {
  const normalized = ingredient.trim().toLowerCase();
  if (!normalized) return [];

  const { rows } = await db.query(
    `SELECT ${ENTRY_SELECT}
     FROM flavor_encyclopedia_entries e
     JOIN flavor_encyclopedia_parts p ON p.id = e.part_id
     WHERE LOWER(e.ingredient_1) = $1 OR LOWER(e.ingredient_2) = $1
     ORDER BY e.confidence NULLS LAST, e.ingredient_1
     LIMIT $2`,
    [normalized, limit]
  );

  return rows.map(mapListItem);
}

export async function getSectionCountsForPart(
  partSlug: string
): Promise<Record<EncyclopediaSectionKey, number>> {
  const { rows } = await db.query(
    `SELECT e.section_key, COUNT(*)::int AS cnt
     FROM flavor_encyclopedia_entries e
     JOIN flavor_encyclopedia_parts p ON p.id = e.part_id
     WHERE p.slug = $1
     GROUP BY e.section_key`,
    [partSlug]
  );

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.section_key as string] = row.cnt as number;
  }
  return result as Record<EncyclopediaSectionKey, number>;
}
