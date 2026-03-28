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

  let isClassic: boolean | undefined;
  let categoryId: number | null | undefined;
  try {
    const ct = req.headers.get("content-type");
    if (ct?.includes("application/json")) {
      const body = await req.json();
      const raw = body?.isClassic;
      if (raw === true || raw === "true") isClassic = true;
      else if (raw === false || raw === "false") isClassic = false;
      if (body?.categoryId != null && body.categoryId !== "") {
        const n = parseInt(String(body.categoryId), 10);
        if (!Number.isNaN(n) && n > 0) categoryId = n;
      } else if (body?.categoryId === null || body?.categoryId === "") {
        categoryId = null;
      }
    }
  } catch {
    /* пустое тело */
  }

  if (isClassic === undefined) {
    return NextResponse.json(
      { ok: false, error: "Укажите, классический коктейль или авторский (поле isClassic)" },
      { status: 400 }
    );
  }

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM cocktail_submissions WHERE id = $1 AND status = 'pending'",
        [submissionId]
      );

      if (rows.length === 0) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      }

      const sub = rows[0] as Record<string, unknown>;

      let slug = String(sub.slug || "").trim();
      const existing = await client.query("SELECT id FROM cocktails WHERE slug = $1", [slug]);
      if (existing.rows.length > 0) {
        slug = `${slug}-${submissionId}`;
      }

      let catId: number | null = null;
      if (categoryId !== undefined && categoryId !== null) {
        const catCheck = await client.query(`SELECT id FROM cocktail_categories WHERE id = $1`, [
          categoryId,
        ]);
        if (catCheck.rows.length === 0) {
          throw Object.assign(new Error("BAD_CATEGORY"), { code: "BAD_CATEGORY" });
        }
        catId = categoryId;
      }

      const ingredients = asJsonbParam(sub.ingredients);
      const social_links = asJsonbParam(sub.social_links);
      const flavor_profile = asJsonbParam(sub.flavor_profile);
      const gallery_urls = asJsonbParam(sub.gallery_urls);

      await client.query(
        `INSERT INTO cocktails (
          category_id, name, slug, image_url, description, method, glass, garnish, ice,
          ingredients, instructions, cordials_recipe, bar_name, bar_city, bar_description, author, classic_original_author,
          social_links, flavor_profile, tags, is_classic, is_published,
          history, allergens, strength_scale, taste_sweet_dry_scale, gallery_urls, nutrition_note, alcohol_content_note,
          submitted_by_user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10::jsonb, $11, $12, $13, $14, $15, $16, $17,
          $18::jsonb, $19::jsonb, $20, $21, true,
          $22, $23, $24, $25, $26::jsonb, $27, $28,
          $29
        )`,
        [
          catId,
          sub.name,
          slug,
          sub.image_url ?? null,
          sub.description ?? null,
          sub.method ?? null,
          sub.glass ?? null,
          sub.garnish ?? null,
          sub.ice ?? null,
          ingredients,
          sub.instructions ?? null,
          sub.cordials_recipe ?? null,
          sub.bar_name ?? null,
          sub.bar_city ?? null,
          sub.bar_description ?? null,
          sub.author ?? null,
          sub.classic_original_author ?? null,
          social_links,
          flavor_profile,
          sub.tags ?? [],
          isClassic,
          sub.history ?? null,
          sub.allergens ?? null,
          sub.strength_scale ?? null,
          sub.taste_sweet_dry_scale ?? null,
          gallery_urls,
          sub.nutrition_note ?? null,
          sub.alcohol_content_note ?? null,
          sub.user_id ?? null,
        ]
      );

      await client.query(
        `UPDATE cocktail_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
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
      return NextResponse.json({ ok: false, error: "Категория коктейлей не найдена" }, { status: 400 });
    }
    console.error("Approve cocktail submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
