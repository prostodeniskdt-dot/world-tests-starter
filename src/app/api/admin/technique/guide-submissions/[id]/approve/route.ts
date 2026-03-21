import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { withTransaction } from "@/lib/db";

function asJsonbParam(v: unknown): string {
  if (v == null) return "[]";
  if (typeof v === "string") {
    try {
      JSON.parse(v);
      return v;
    } catch {
      return "[]";
    }
  }
  return JSON.stringify(v);
}

function parseStringArray(val: unknown): string[] {
  if (typeof val === "string") {
    try {
      return parseStringArray(JSON.parse(val));
    } catch {
      return [];
    }
  }
  if (Array.isArray(val)) {
    return val.map((x) => String(x ?? "").trim().slice(0, 120)).filter(Boolean).slice(0, 32);
  }
  return [];
}

function parseSlugListFromBody(body: Record<string, unknown> | null, keys: string[]): string[] {
  if (!body) return [];
  for (const k of keys) {
    const raw = body[k];
    if (Array.isArray(raw)) {
      const out: string[] = [];
      for (const x of raw) {
        const s = String(x ?? "").trim().slice(0, 120);
        if (s) out.push(s);
        if (out.length >= 24) break;
      }
      return out;
    }
  }
  return [];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const submissionId = parseInt(id, 10);
  if (Number.isNaN(submissionId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  let bodyJson: Record<string, unknown> | null = null;
  try {
    const ct = req.headers.get("content-type");
    if (ct?.includes("application/json")) {
      bodyJson = (await req.json()) as Record<string, unknown>;
    }
  } catch {
    bodyJson = null;
  }

  let categoryOverride: number | undefined;
  if (bodyJson?.categoryId != null && bodyJson.categoryId !== "") {
    const n = parseInt(String(bodyJson.categoryId), 10);
    if (!Number.isNaN(n) && n > 0) categoryOverride = n;
  }

  const equipmentSlugs = parseSlugListFromBody(bodyJson, ["equipmentSlugs", "equipment_slugs"]);

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM technique_guide_submissions WHERE id = $1 AND status = 'pending'",
        [submissionId]
      );
      if (rows.length === 0) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      }
      const sub = rows[0] as Record<string, unknown>;

      let slug = String(sub.slug || "").trim();
      const existing = await client.query("SELECT id FROM technique_guides WHERE slug = $1", [slug]);
      if (existing.rows.length > 0) {
        slug = `${slug}-${submissionId}`;
      }

      let catId = categoryOverride ?? (sub.category_id as number);
      const cchk = await client.query(`SELECT id FROM technique_guide_categories WHERE id = $1`, [catId]);
      if (cchk.rows.length === 0) {
        throw Object.assign(new Error("BAD_CATEGORY"), { code: "BAD_CATEGORY" });
      }

      let articleId = sub.related_knowledge_article_id as number | null;
      if (articleId != null) {
        const achk = await client.query(
          `SELECT id FROM knowledge_articles WHERE id = $1 AND is_published = true LIMIT 1`,
          [articleId]
        );
        if (achk.rows.length === 0) articleId = null;
      }

      const gallery = asJsonbParam(sub.gallery_urls);
      const cocktail_slugs = asJsonbParam(sub.cocktail_slugs);
      const tags = Array.isArray(sub.tags) ? sub.tags : [];
      const naSlugs = parseStringArray(sub.na_slugs);
      const alcoholSlugs = parseStringArray(sub.alcohol_slugs);

      const ins = await client.query(
        `INSERT INTO technique_guides (
          category_id, name, slug, difficulty, short_description, instruction_text, video_url,
          gallery_urls, typical_mistakes, tips, cocktail_slugs, tags, related_knowledge_article_id, is_published
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8::jsonb, $9, $10, $11::jsonb, $12, $13, true
        ) RETURNING id`,
        [
          catId,
          sub.name,
          slug,
          sub.difficulty ?? null,
          sub.short_description ?? null,
          sub.instruction_text ?? null,
          sub.video_url ?? null,
          gallery,
          sub.typical_mistakes ?? null,
          sub.tips ?? null,
          cocktail_slugs,
          tags,
          articleId,
        ]
      );

      const newGuideId = (ins.rows[0] as { id: number }).id;

      for (const na of naSlugs) {
        await client.query(
          `INSERT INTO technique_guide_na_links (guide_id, na_product_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newGuideId, na]
        );
      }
      for (const al of alcoholSlugs) {
        await client.query(
          `INSERT INTO technique_guide_alcohol_links (guide_id, alcohol_product_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newGuideId, al]
        );
      }

      for (const eqSlug of equipmentSlugs) {
        const er = await client.query(
          `SELECT id FROM equipment WHERE slug = $1 AND is_published = true LIMIT 1`,
          [eqSlug]
        );
        if (er.rows.length === 0) continue;
        const eid = (er.rows[0] as { id: number }).id;
        await client.query(
          `INSERT INTO equipment_technique_links (equipment_id, guide_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [eid, newGuideId]
        );
      }

      await client.query(
        `UPDATE technique_guide_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
        [adminResult.userId, submissionId]
      );
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Заявка не найдена" }, { status: 404 });
    }
    if (code === "BAD_CATEGORY") {
      return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 400 });
    }
    console.error("Approve guide submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
