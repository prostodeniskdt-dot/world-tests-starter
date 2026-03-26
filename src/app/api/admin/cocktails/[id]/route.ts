import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const { rows } = await db.query("SELECT * FROM cocktails WHERE id = $1", [numId]);
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error("Admin get cocktail error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  const name = body.name != null ? String(body.name).trim() : "";
  if (!name) {
    return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });
  }

  const ingredientsJson = JSON.stringify(Array.isArray(body.ingredients) ? body.ingredients : []);
  const socialJson = JSON.stringify(body.social_links && typeof body.social_links === "object" ? body.social_links : {});
  const flavorJson = JSON.stringify(body.flavor_profile && typeof body.flavor_profile === "object" ? body.flavor_profile : {});
  const galleryJson = JSON.stringify(Array.isArray(body.gallery_urls) ? body.gallery_urls : []);
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

  try {
    const { rowCount } = await db.query(
      `UPDATE cocktails SET
         name=$1, slug=$2, category_id=$3, description=$4, method=$5, glass=$6, garnish=$7, ice=$8,
         ingredients=$9::jsonb, instructions=$10, cordials_recipe=$11,
         bar_name=$12, bar_city=$13, bar_description=$14, author=$15, classic_original_author=$16,
         social_links=$17::jsonb, flavor_profile=$18::jsonb, tags=$19, image_url=$20, gallery_urls=$21::jsonb,
         is_classic=$22, is_published=$23,
         strength_scale=$24, taste_sweet_dry_scale=$25,
         history=$26, allergens=$27, nutrition_note=$28, alcohol_content_note=$29,
         updated_at=now()
       WHERE id=$30`,
      [
        name,
        body.slug ? String(body.slug).trim() : undefined,
        body.category_id != null && body.category_id !== "" ? Number(body.category_id) : null,
        body.description || null, body.method || null, body.glass || null,
        body.garnish || null, body.ice || null,
        ingredientsJson, body.instructions || null, body.cordials_recipe || null,
        body.bar_name || null, body.bar_city || null, body.bar_description || null, body.author || null,
        body.classic_original_author || null,
        socialJson, flavorJson, tags, body.image_url || null, galleryJson,
        body.is_classic === true || body.is_classic === "true",
        body.is_published !== false && body.is_published !== "false",
        body.strength_scale != null && body.strength_scale !== "" ? Number(body.strength_scale) : null,
        body.taste_sweet_dry_scale != null && body.taste_sweet_dry_scale !== "" ? Number(body.taste_sweet_dry_scale) : null,
        body.history || null, body.allergens || null,
        body.nutrition_note || null, body.alcohol_content_note || null,
        numId,
      ]
    );
    if (!rowCount) {
      return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin update cocktail error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const { rowCount } = await db.query("DELETE FROM cocktails WHERE id = $1", [numId]);
    if (!rowCount) {
      return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete cocktail error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка удаления" }, { status: 500 });
  }
}
