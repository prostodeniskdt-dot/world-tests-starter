import "server-only";
import { db } from "@/lib/db";

export type ContributionStatus = "pending" | "approved" | "rejected";

export type Contribution = {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  slug: string | null;
  status: ContributionStatus;
  createdAt: string;
  updatedAt: string;
  publicHref: string | null;
  editHref: string | null;
};

export type UserContributions = {
  items: Contribution[];
  unavailableKinds: string[];
};

type RawContribution = {
  id: string | number;
  title: string;
  slug: string | null;
  public_slug: string | null;
  status: ContributionStatus;
  created_at: string;
  updated_at: string;
};

type ContributionSource = {
  kind: string;
  label: string;
  sql: string;
  publicHref: (slug: string) => string;
  editHref?: (item: RawContribution) => string | null;
};

const SOURCES: ContributionSource[] = [
  {
    kind: "article",
    label: "Статья",
    sql: `SELECT s.id, s.title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM article_submissions s
          LEFT JOIN LATERAL (
            SELECT a.slug FROM knowledge_articles a
            WHERE a.author_id = s.user_id AND a.is_published = true
              AND (a.slug = s.slug OR a.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/knowledge/${encodeURIComponent(slug)}`,
    editHref: () => "/knowledge/my-submissions",
  },
  {
    kind: "cocktail",
    label: "Коктейль",
    sql: `SELECT s.id, s.name AS title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM cocktail_submissions s
          LEFT JOIN LATERAL (
            SELECT c.slug FROM cocktails c
            WHERE c.submitted_by_user_id = s.user_id AND c.is_published = true
              AND (c.slug = s.slug OR c.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/cocktails/${encodeURIComponent(slug)}`,
  },
  {
    kind: "prep",
    label: "Заготовка",
    sql: `SELECT s.id, s.name AS title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM prep_submissions s
          LEFT JOIN LATERAL (
            SELECT p.slug FROM preps p
            WHERE p.is_published = true
              AND (p.slug = s.slug OR p.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/preps/${encodeURIComponent(slug)}`,
    editHref: (item) =>
      item.status === "pending" ? `/preps/submissions/${item.id}/edit` : null,
  },
  {
    kind: "alcohol",
    label: "Алкоголь",
    sql: `SELECT s.id, s.name AS title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM alcohol_submissions s
          LEFT JOIN LATERAL (
            SELECT p.slug FROM alcohol_products p
            WHERE p.is_published = true
              AND (p.slug = s.slug OR p.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/alcohol/${encodeURIComponent(slug)}`,
  },
  {
    kind: "na",
    label: "Б/а ингредиент",
    sql: `SELECT s.id, s.name AS title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM na_submissions s
          LEFT JOIN LATERAL (
            SELECT p.slug FROM na_products p
            WHERE p.is_published = true
              AND (p.slug = s.slug OR p.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/na/${encodeURIComponent(slug)}`,
  },
  {
    kind: "equipment",
    label: "Оборудование",
    sql: `SELECT s.id, s.name AS title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM equipment_submissions s
          LEFT JOIN LATERAL (
            SELECT e.slug FROM equipment e
            WHERE e.is_published = true
              AND (e.slug = s.slug OR e.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/technique/equipment/${encodeURIComponent(slug)}`,
  },
  {
    kind: "technique",
    label: "Техника",
    sql: `SELECT s.id, s.name AS title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM technique_guide_submissions s
          LEFT JOIN LATERAL (
            SELECT g.slug FROM technique_guides g
            WHERE g.is_published = true
              AND (g.slug = s.slug OR g.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/technique/skills/${encodeURIComponent(slug)}`,
  },
  {
    kind: "glassware",
    label: "Посуда",
    sql: `SELECT s.id, s.name AS title, s.slug, s.status, s.created_at, s.updated_at,
                 published.slug AS public_slug
          FROM glassware_submissions s
          LEFT JOIN LATERAL (
            SELECT g.slug FROM glassware g
            WHERE g.is_published = true
              AND (g.slug = s.slug OR g.slug = s.slug || '-' || s.id::text)
            LIMIT 1
          ) published ON s.status = 'approved'
          WHERE s.user_id = $1
          ORDER BY s.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/glassware/${encodeURIComponent(slug)}`,
  },
  {
    kind: "equipment-review",
    label: "Отзыв",
    sql: `SELECT r.id, ('Отзыв: ' || e.name) AS title, e.slug, e.slug AS public_slug, r.status,
                 r.created_at, r.created_at AS updated_at
          FROM equipment_reviews r
          INNER JOIN equipment e ON e.id = r.equipment_id
          WHERE r.user_id = $1
          ORDER BY r.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/technique/equipment/${encodeURIComponent(slug)}#reviews`,
  },
  {
    kind: "glassware-photo",
    label: "Фото",
    sql: `SELECT p.id, ('Фото: ' || g.name) AS title, g.slug, g.slug AS public_slug, p.status,
                 p.created_at, p.created_at AS updated_at
          FROM glassware_drink_photos p
          INNER JOIN glassware g ON g.id = p.glassware_id
          WHERE p.user_id = $1
          ORDER BY p.created_at DESC LIMIT 100`,
    publicHref: (slug) => `/glassware/${encodeURIComponent(slug)}`,
  },
];

function isContributionStatus(value: unknown): value is ContributionStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

export async function getUserContributions(userId: string): Promise<UserContributions> {
  const results = await Promise.allSettled(
    SOURCES.map((source) => db.query(source.sql, [userId]))
  );

  const items: Contribution[] = [];
  const unavailableKinds: string[] = [];

  results.forEach((result, index) => {
    const source = SOURCES[index];
    if (result.status === "rejected") {
      console.error(`Contributions ${source.kind} query failed:`, result.reason);
      unavailableKinds.push(source.label);
      return;
    }

    for (const raw of result.value.rows as RawContribution[]) {
      if (!isContributionStatus(raw.status)) continue;
      const slug = raw.slug ? String(raw.slug) : null;
      const publicSlug = raw.public_slug ? String(raw.public_slug) : null;
      items.push({
        id: `${source.kind}-${raw.id}`,
        kind: source.kind,
        kindLabel: source.label,
        title: String(raw.title),
        slug,
        status: raw.status,
        createdAt: String(raw.created_at),
        updatedAt: String(raw.updated_at),
        publicHref:
          raw.status === "approved" && publicSlug
            ? source.publicHref(publicSlug)
            : null,
        editHref: source.editHref?.(raw) ?? null,
      });
    }
  });

  items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { items, unavailableKinds };
}
