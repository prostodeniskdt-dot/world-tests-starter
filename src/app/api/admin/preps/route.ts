import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category");

  let where = "1=1";
  const values: unknown[] = [];
  let i = 1;

  if (q) {
    where += ` AND (name ILIKE $${i} OR slug ILIKE $${i} OR composition ILIKE $${i})`;
    values.push(`%${q}%`);
    i++;
  }
  if (category) {
    where += ` AND category_id = $${i}`;
    values.push(Number(category));
    i++;
  }

  try {
    const { rows } = await db.query(
      `SELECT id, name, slug, image_url, category_id, is_published, composition, tags
       FROM preps WHERE ${where} ORDER BY id DESC`,
      values
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Admin preps list error:", err);
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
  if (!name) return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });

  let slug = body.slug ? String(body.slug).trim() : "";
  slug = slugify(slug || name);
  if (!slug) slug = `prep-${Date.now()}`;

  const ingredientsJson = JSON.stringify(Array.isArray(body.ingredients) ? body.ingredients : []);
  const socialJson = JSON.stringify(
    body.social_links && typeof body.social_links === "object" ? body.social_links : {}
  );
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

  try {
    const { rows } = await db.query(
      `INSERT INTO preps (
         name, slug, category_id, composition, ingredients, tags, image_url,
         author, bar_name, bar_city, bar_description, social_links,
         is_published
       ) VALUES (
         $1,$2,$3,$4,$5::jsonb,$6,$7,
         $8,$9,$10,$11,$12::jsonb,
         $13
       ) RETURNING id`,
      [
        name,
        slug,
        body.category_id != null && body.category_id !== "" ? Number(body.category_id) : null,
        body.composition || null,
        ingredientsJson,
        tags,
        body.image_url || null,
        body.author || null,
        body.bar_name || null,
        body.bar_city || null,
        body.bar_description || null,
        socialJson,
        body.is_published !== false && body.is_published !== "false",
      ]
    );
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Admin create prep error:", err);
    const msg =
      err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505"
        ? "Заготовка с таким slug уже существует"
        : "Ошибка создания";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

