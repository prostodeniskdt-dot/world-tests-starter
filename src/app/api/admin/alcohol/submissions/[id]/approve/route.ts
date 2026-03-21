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

  let categoryIdOverride: number | null | undefined;
  try {
    const ct = req.headers.get("content-type");
    if (ct?.includes("application/json")) {
      const body = await req.json();
      if (body?.categoryId === null || body?.categoryId === "") {
        categoryIdOverride = null;
      } else if (body?.categoryId != null) {
        const n = parseInt(String(body.categoryId), 10);
        if (!Number.isNaN(n) && n > 0) categoryIdOverride = n;
      }
    }
  } catch {
    /* пустое тело */
  }

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM alcohol_submissions WHERE id = $1 AND status = 'pending'",
        [submissionId]
      );

      if (rows.length === 0) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      }

      const sub = rows[0] as Record<string, unknown>;

      let slug = String(sub.slug || "").trim();
      const existing = await client.query("SELECT id FROM alcohol_products WHERE slug = $1", [slug]);
      if (existing.rows.length > 0) {
        slug = `${slug}-${submissionId}`;
      }

      let catId: number | null =
        categoryIdOverride !== undefined ? categoryIdOverride : (sub.category_id as number | null);
      if (catId != null) {
        const catCheck = await client.query(`SELECT id FROM alcohol_categories WHERE id = $1`, [catId]);
        if (catCheck.rows.length === 0) {
          throw Object.assign(new Error("BAD_CATEGORY"), { code: "BAD_CATEGORY" });
        }
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
      const sensory = asJsonbParam(sub.sensory_matrix);

      await client.query(
        `INSERT INTO alcohol_products (
          category_id, name, slug, image_url, description, history, country, region, producer, abv,
          flavor_profile, sensory_matrix, grape_or_raw_material, volume, serving_temperature,
          aging_method, production_method, interesting_facts, about_brand, gastronomy,
          wine_or_spirit_style, tasting_notes, vineyards_or_origin_detail, food_usage,
          practice_test_id, related_knowledge_article_id, is_published
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11::jsonb, $12::jsonb, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, true
        )`,
        [
          catId,
          sub.name,
          slug,
          sub.image_url ?? null,
          sub.description ?? null,
          sub.history ?? null,
          sub.country ?? null,
          sub.region ?? null,
          sub.producer ?? null,
          sub.abv ?? null,
          flavor,
          sensory,
          sub.grape_or_raw_material ?? null,
          sub.volume ?? null,
          sub.serving_temperature ?? null,
          sub.aging_method ?? null,
          sub.production_method ?? null,
          sub.interesting_facts ?? null,
          sub.about_brand ?? null,
          sub.gastronomy ?? null,
          sub.wine_or_spirit_style ?? null,
          sub.tasting_notes ?? null,
          sub.vineyards_or_origin_detail ?? null,
          sub.food_usage ?? null,
          practiceTestId,
          articleId,
        ]
      );

      await client.query(
        `UPDATE alcohol_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
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
    console.error("Approve alcohol submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
