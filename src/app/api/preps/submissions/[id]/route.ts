import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isAllowedKnowledgeMediaUrl } from "@/lib/knowledgeMediaUrl";
import { slugify } from "@/lib/slugify";

function trimText(v: unknown, max: number): string | null {
  const s = v != null ? String(v).trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeIngredients(raw: unknown): { name: string; amount: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { name: string; amount: string }[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const name = sanitizeHtml(String(o.name ?? "").trim(), { allowedTags: [], allowedAttributes: {} }).slice(0, 200);
    const amount = sanitizeHtml(String(o.amount ?? "").trim(), { allowedTags: [], allowedAttributes: {} }).slice(0, 120);
    if (!name && !amount) continue;
    out.push({ name, amount });
    if (out.length >= 40) break;
  }
  return out;
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    const s = sanitizeHtml(String(t ?? "").trim(), { allowedTags: [], allowedAttributes: {} })
      .toLowerCase()
      .slice(0, 64);
    if (!s) continue;
    out.push(s);
    if (out.length >= 24) break;
  }
  return Array.from(new Set(out));
}

function normalizeSocialLinks(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = k.slice(0, 32).replace(/[^\w-]/g, "");
    if (!key) continue;
    const val = String(v ?? "").trim().slice(0, 500);
    if (val) out[key] = val;
    if (Object.keys(out).length >= 10) break;
  }
  return out;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const submissionId = parseInt(id, 10);
  if (Number.isNaN(submissionId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const { rows } = await db.query(
      `SELECT * FROM prep_submissions WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [submissionId, auth.userId]
    );
    if (rows.length === 0) return NextResponse.json({ ok: false, error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error("Get prep submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const submissionId = parseInt(id, 10);
  if (Number.isNaN(submissionId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный формат запроса (тело не JSON)" }, { status: 400 });
  }

  const name = trimText(body.name, 200);
  if (!name) return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });

  const categoryIdRaw = body.category_id ?? body.categoryId;
  const category_id = categoryIdRaw != null && categoryIdRaw !== "" ? Number(categoryIdRaw) : null;
  if (!category_id || Number.isNaN(category_id) || category_id <= 0) {
    return NextResponse.json({ ok: false, error: "Выберите категорию" }, { status: 400 });
  }

  const catRes = await db.query(`SELECT id FROM prep_categories WHERE id = $1`, [category_id]);
  if (catRes.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 400 });
  }

  let slug = trimText(body.slug, 120) || slugify(name);
  slug = slugify(slug);
  if (!slug) slug = `prep-${Date.now()}`;

  const composition = trimText(body.composition, 8000);
  const ingredients = normalizeIngredients(body.ingredients);
  if (!composition && ingredients.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Добавьте состав или список ингредиентов" },
      { status: 400 }
    );
  }

  const imageRaw = body.image_url != null ? String(body.image_url).trim() : "";
  const image_url = imageRaw || null;
  if (image_url && !isAllowedKnowledgeMediaUrl(image_url)) {
    return NextResponse.json({ ok: false, error: "Фото: разрешены только файлы, загруженные на сайт" }, { status: 400 });
  }

  const tags = normalizeTags(body.tags);
  const social_links = normalizeSocialLinks(body.social_links);

  const author = trimText(body.author, 200);
  const bar_name = trimText(body.bar_name, 200);
  const bar_city = trimText(body.bar_city, 120);
  const bar_description = trimText(body.bar_description, 2000);

  try {
    const { rowCount } = await db.query(
      `UPDATE prep_submissions SET
        category_id = $1,
        name = $2,
        slug = $3,
        composition = $4,
        ingredients = $5::jsonb,
        tags = $6,
        image_url = $7,
        author = $8,
        bar_name = $9,
        bar_city = $10,
        bar_description = $11,
        social_links = $12::jsonb,
        updated_at = now()
       WHERE id = $13 AND user_id = $14 AND status = 'pending'`,
      [
        category_id,
        name,
        slug,
        composition,
        JSON.stringify(ingredients),
        tags,
        image_url,
        author,
        bar_name,
        bar_city,
        bar_description,
        JSON.stringify(social_links),
        submissionId,
        auth.userId,
      ]
    );
    if (!rowCount) {
      return NextResponse.json(
        { ok: false, error: "Нельзя редактировать: заявка не найдена или уже обработана" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update prep submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}

