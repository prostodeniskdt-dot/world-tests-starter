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

function parseSubstituteSlugs(body: Record<string, unknown> | null): string[] {
  if (!body) return [];
  const raw = body.substituteSlugs ?? body.substitute_slugs;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    const s = String(x ?? "").trim().slice(0, 120);
    if (s) out.push(s);
    if (out.length >= 20) break;
  }
  return out;
}

function parseLinkedGuideSlugs(body: Record<string, unknown> | null): string[] {
  if (!body) return [];
  const raw = body.linkedGuideSlugs ?? body.linked_guide_slugs;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    const s = String(x ?? "").trim().slice(0, 120);
    if (s) out.push(s);
    if (out.length >= 24) break;
  }
  return out;
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

  let categoryOverride: number | null | undefined;
  if (bodyJson?.categoryId != null && bodyJson.categoryId !== "") {
    const n = parseInt(String(bodyJson.categoryId), 10);
    if (!Number.isNaN(n) && n > 0) categoryOverride = n;
  } else if (bodyJson?.categoryId === null || bodyJson?.categoryId === "") {
    categoryOverride = null;
  }

  const substituteSlugs = parseSubstituteSlugs(bodyJson);
  const linkedGuideSlugs = parseLinkedGuideSlugs(bodyJson);

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM glassware_submissions WHERE id = $1 AND status = 'pending'",
        [submissionId]
      );
      if (rows.length === 0) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      }
      const sub = rows[0] as Record<string, unknown>;

      let slug = String(sub.slug || "").trim();
      const existing = await client.query("SELECT id FROM glassware WHERE slug = $1", [slug]);
      if (existing.rows.length > 0) {
        slug = `${slug}-${submissionId}`;
      }

      let catId: number | null =
        categoryOverride !== undefined ? categoryOverride : (sub.category_id as number | null);
      if (catId != null) {
        const chk = await client.query(`SELECT id FROM glassware_categories WHERE id = $1`, [catId]);
        if (chk.rows.length === 0) {
          throw Object.assign(new Error("BAD_CATEGORY"), { code: "BAD_CATEGORY" });
        }
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
      const purchase = asJsonbParam(sub.purchase_links);
      const tags = Array.isArray(sub.tags) ? sub.tags : [];
      const volumeMl = sub.volume_ml != null && !Number.isNaN(Number(sub.volume_ml))
        ? Number(sub.volume_ml)
        : null;

      const ins = await client.query(
        `INSERT INTO glassware (
          category_id, name, slug, image_url, description, volume, dimensions, usage,
          subcategory_text, producer, material, volume_ml, price_segment, price_range,
          purchase_links, audience, tags, gallery_urls,
          ideal_for_drinks, not_suitable_for, experience_pros, experience_cons,
          practicality_score, aesthetics_score, durability_score,
          related_knowledge_article_id, is_published
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15::jsonb, $16, $17, $18::jsonb,
          $19, $20, $21, $22,
          $23, $24, $25,
          $26, true
        ) RETURNING id`,
        [
          catId,
          sub.name,
          slug,
          sub.image_url ?? null,
          sub.description ?? null,
          volumeMl != null ? `${volumeMl} мл` : null,
          sub.dimensions ?? null,
          sub.ideal_for_drinks ?? null,
          sub.subcategory_text ?? null,
          sub.producer ?? null,
          sub.material ?? null,
          volumeMl,
          sub.price_segment ?? null,
          sub.price_range ?? null,
          purchase,
          sub.audience ?? null,
          tags,
          gallery,
          sub.ideal_for_drinks ?? null,
          sub.not_suitable_for ?? null,
          sub.experience_pros ?? null,
          sub.experience_cons ?? null,
          sub.practicality_score ?? null,
          sub.aesthetics_score ?? null,
          sub.durability_score ?? null,
          articleId,
        ]
      );

      const newId = (ins.rows[0] as { id: number }).id;

      for (const sSlug of substituteSlugs) {
        const pr = await client.query(
          `SELECT id FROM glassware WHERE slug = $1 AND is_published = true LIMIT 1`,
          [sSlug]
        );
        if (pr.rows.length === 0) continue;
        const otherId = (pr.rows[0] as { id: number }).id;
        if (otherId === newId) continue;
        const a = Math.min(newId, otherId);
        const b = Math.max(newId, otherId);
        await client.query(
          `INSERT INTO glassware_substitutes (product_id, substitute_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [a, b]
        );
      }

      for (const gSlug of linkedGuideSlugs) {
        const gr = await client.query(
          `SELECT id FROM technique_guides WHERE slug = $1 AND is_published = true LIMIT 1`,
          [gSlug]
        );
        if (gr.rows.length === 0) continue;
        const gid = (gr.rows[0] as { id: number }).id;
        await client.query(
          `INSERT INTO glassware_technique_links (glassware_id, guide_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newId, gid]
        );
      }

      await client.query(
        `UPDATE glassware_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
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
    console.error("Approve glassware submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
