import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const classic = searchParams.get("classic");
  const category = searchParams.get("category");

  let where = "1=1";
  const values: unknown[] = [];
  let i = 1;

  if (q) {
    where += ` AND (name ILIKE $${i} OR slug ILIKE $${i})`;
    values.push(`%${q}%`);
    i++;
  }
  if (classic === "true") where += ` AND is_classic = true`;
  else if (classic === "false") where += ` AND is_classic = false`;

  if (category) {
    where += ` AND category_id = $${i}`;
    values.push(Number(category));
    i++;
  }

  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, image_url, category_id, is_classic, is_published, description
       FROM cocktails WHERE ${where} ORDER BY id DESC`,
      values
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Admin cocktails list error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

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

  let slug = body.slug ? String(body.slug).trim() : "";
  slug = slugify(slug || name);
  if (!slug) slug = `cocktail-${Date.now()}`;

  const ingredientsJson = JSON.stringify(Array.isArray(body.ingredients) ? body.ingredients : []);
  const socialJson = JSON.stringify(body.social_links && typeof body.social_links === "object" ? body.social_links : {});
  const flavorJson = JSON.stringify(body.flavor_profile && typeof body.flavor_profile === "object" ? body.flavor_profile : {});
  const galleryJson = JSON.stringify(Array.isArray(body.gallery_urls) ? body.gallery_urls : []);
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

  try {
    const { rows } = await db.query(
      `INSERT INTO cocktails (
         name, slug, category_id, description, method, glass, garnish, ice,
         ingredients, instructions, cordials_recipe,
         bar_name, bar_city, bar_description, author,
         social_links, flavor_profile, tags, image_url, gallery_urls,
         is_classic, is_published,
         strength_scale, taste_sweet_dry_scale,
         history, allergens, nutrition_note, alcohol_content_note
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,
         $9::jsonb,$10,$11,
         $12,$13,$14,$15,
         $16::jsonb,$17::jsonb,$18,$19,$20::jsonb,
         $21,$22,
         $23,$24,
         $25,$26,$27,$28
       ) RETURNING id`,
      [
        name, slug,
        body.category_id != null && body.category_id !== "" ? Number(body.category_id) : null,
        body.description || null, body.method || null, body.glass || null,
        body.garnish || null, body.ice || null,
        ingredientsJson, body.instructions || null, body.cordials_recipe || null,
        body.bar_name || null, body.bar_city || null, body.bar_description || null, body.author || null,
        socialJson, flavorJson, tags, body.image_url || null, galleryJson,
        body.is_classic === true || body.is_classic === "true",
        body.is_published !== false && body.is_published !== "false",
        body.strength_scale != null && body.strength_scale !== "" ? Number(body.strength_scale) : null,
        body.taste_sweet_dry_scale != null && body.taste_sweet_dry_scale !== "" ? Number(body.taste_sweet_dry_scale) : null,
        body.history || null, body.allergens || null,
        body.nutrition_note || null, body.alcohol_content_note || null,
      ]
    );
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Admin create cocktail error:", err);
    const msg = err && typeof err === "object" && "code" in err && (err as {code:string}).code === "23505"
      ? "Коктейль с таким slug уже существует" : "Ошибка создания";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
