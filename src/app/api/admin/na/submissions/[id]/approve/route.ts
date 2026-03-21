import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { withTransaction } from "@/lib/db";

function asJsonbParam(v: unknown): string {
  if (v == null) return "{}";
  if (typeof v === "string") {
    try {
      JSON.parse(v);
      return v;
    } catch {
      return "{}";
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

  let categoryIdOverride: number | undefined;
  let bodyJson: Record<string, unknown> | null = null;
  try {
    const ct = req.headers.get("content-type");
    if (ct?.includes("application/json")) {
      bodyJson = (await req.json()) as Record<string, unknown>;
      if (bodyJson?.categoryId != null && bodyJson.categoryId !== "") {
        const n = parseInt(String(bodyJson.categoryId), 10);
        if (!Number.isNaN(n) && n > 0) categoryIdOverride = n;
      }
    }
  } catch {
    bodyJson = null;
  }

  const substituteSlugs = parseSubstituteSlugs(bodyJson);

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM na_submissions WHERE id = $1 AND status = 'pending'",
        [submissionId]
      );

      if (rows.length === 0) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      }

      const sub = rows[0] as Record<string, unknown>;

      let slug = String(sub.slug || "").trim();
      const existing = await client.query("SELECT id FROM na_products WHERE slug = $1", [slug]);
      if (existing.rows.length > 0) {
        slug = `${slug}-${submissionId}`;
      }

      let catId = categoryIdOverride ?? (sub.category_id as number);
      const catCheck = await client.query(`SELECT id FROM na_categories WHERE id = $1`, [catId]);
      if (catCheck.rows.length === 0) {
        throw Object.assign(new Error("BAD_CATEGORY"), { code: "BAD_CATEGORY" });
      }

      let practiceTestId = (sub.practice_test_id as string | null) || null;
      if (practiceTestId) {
        const tchk = await client.query(
          `SELECT id FROM tests WHERE id = $1 AND is_published = true LIMIT 1`,
          [practiceTestId]
        );
        if (tchk.rows.length === 0) practiceTestId = null;
      }

      let articleId = sub.related_knowledge_article_id as number | null;
      if (articleId != null) {
        const achk = await client.query(
          `SELECT id FROM knowledge_articles WHERE id = $1 AND is_published = true LIMIT 1`,
          [articleId]
        );
        if (achk.rows.length === 0) articleId = null;
      }

      const flavor = asJsonbParam(sub.flavor_profile);
      const specific = asJsonbParam(sub.category_specific);
      const extra = asJsonbParam(sub.category_extra);
      const tags = Array.isArray(sub.tags) ? sub.tags : [];

      const ins = await client.query(
        `INSERT INTO na_products (
          category_id, name, slug, image_url, description, composition, calories, producer, flavor_profile,
          subcategory_text, tags, country, amount_numeric, amount_unit, taste_description,
          usage_in_drinks, usage_in_food, about_brand, interesting_facts,
          category_specific, category_extra, practice_test_id, related_knowledge_article_id,
          is_published
        ) VALUES (
          $1, $2, $3, $4, $5, null, null, $6, $7::jsonb,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18::jsonb, $19::jsonb, $20, $21,
          true
        ) RETURNING id`,
        [
          catId,
          sub.name,
          slug,
          sub.image_url ?? null,
          sub.description ?? null,
          sub.producer ?? null,
          flavor,
          sub.subcategory_text ?? null,
          tags,
          sub.country ?? null,
          sub.amount_numeric ?? null,
          sub.amount_unit ?? null,
          sub.taste_description ?? null,
          sub.usage_in_drinks ?? null,
          sub.usage_in_food ?? null,
          sub.about_brand ?? null,
          sub.interesting_facts ?? null,
          specific,
          extra,
          practiceTestId,
          articleId,
        ]
      );

      const newId = (ins.rows[0] as { id: number }).id;

      for (const sSlug of substituteSlugs) {
        const pr = await client.query(
          `SELECT id FROM na_products WHERE slug = $1 AND is_published = true LIMIT 1`,
          [sSlug]
        );
        if (pr.rows.length === 0) continue;
        const otherId = (pr.rows[0] as { id: number }).id;
        if (otherId === newId) continue;
        const a = Math.min(newId, otherId);
        const b = Math.max(newId, otherId);
        await client.query(
          `INSERT INTO na_product_substitutes (product_id, substitute_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [a, b]
        );
      }

      await client.query(
        `UPDATE na_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
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
    console.error("Approve NA submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
