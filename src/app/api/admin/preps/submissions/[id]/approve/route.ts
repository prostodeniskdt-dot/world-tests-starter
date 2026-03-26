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

  let categoryId: number | null | undefined;
  try {
    const ct = req.headers.get("content-type");
    if (ct?.includes("application/json")) {
      const body = await req.json();
      if (body?.categoryId != null && body.categoryId !== "") {
        const n = parseInt(String(body.categoryId), 10);
        if (!Number.isNaN(n) && n > 0) categoryId = n;
      } else if (body?.categoryId === null || body?.categoryId === "") {
        categoryId = null;
      }
    }
  } catch {
    /* empty */
  }

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM prep_submissions WHERE id = $1 AND status = 'pending'",
        [submissionId]
      );
      if (rows.length === 0) throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });

      const sub = rows[0] as Record<string, unknown>;

      let slug = String(sub.slug || "").trim();
      const existing = await client.query("SELECT id FROM preps WHERE slug = $1", [slug]);
      if (existing.rows.length > 0) slug = `${slug}-${submissionId}`;

      let catId: number | null = null;
      const subCatRaw = sub.category_id;
      if (categoryId !== undefined && categoryId !== null) {
        const cc = await client.query(`SELECT id FROM prep_categories WHERE id = $1`, [categoryId]);
        if (cc.rows.length === 0) throw Object.assign(new Error("BAD_CATEGORY"), { code: "BAD_CATEGORY" });
        catId = categoryId;
      } else if (categoryId === null) {
        catId = null;
      } else if (subCatRaw != null) {
        const n = parseInt(String(subCatRaw), 10);
        if (!Number.isNaN(n) && n > 0) catId = n;
      }

      const ingredients = asJsonbParam(sub.ingredients);
      const social_links = asJsonbParam(sub.social_links);

      await client.query(
        `INSERT INTO preps (
          category_id, name, slug, image_url, composition, ingredients, tags,
          author, bar_name, bar_city, bar_description, social_links,
          is_published
        ) VALUES (
          $1,$2,$3,$4,$5,$6::jsonb,$7,
          $8,$9,$10,$11,$12::jsonb,
          true
        )`,
        [
          catId,
          sub.name,
          slug,
          sub.image_url ?? null,
          sub.composition ?? null,
          ingredients,
          sub.tags ?? [],
          sub.author ?? null,
          sub.bar_name ?? null,
          sub.bar_city ?? null,
          sub.bar_description ?? null,
          social_links,
        ]
      );

      await client.query(
        `UPDATE prep_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
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
      return NextResponse.json({ ok: false, error: "Категория заготовок не найдена" }, { status: 400 });
    }
    console.error("Approve prep submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}

