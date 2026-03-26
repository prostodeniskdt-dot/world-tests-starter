import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isAllowedKnowledgeMediaUrl } from "@/lib/knowledgeMediaUrl";
import { userMessageFromDbError } from "@/lib/pg-api-errors";
import { checkRateLimit, submitRateLimiterByUser } from "@/lib/rateLimit";
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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const rl = await checkRateLimit(submitRateLimiterByUser, auth.userId);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Слишком много отправок. Подождите минуту." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный формат запроса (тело не JSON)" }, { status: 400 });
  }

  const photoOk = body.photo_rights_confirmed === true || body.photo_rights_confirmed === "true";
  if (!photoOk) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Нужно подтвердить права на фото: вы используете только материалы без нарушения авторских прав или даёте полное разрешение на публикацию.",
      },
      { status: 400 }
    );
  }

  const name = trimText(body.name, 200);
  if (!name) return NextResponse.json({ ok: false, error: "Укажите название заготовки" }, { status: 400 });

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
    return NextResponse.json(
      { ok: false, error: "Фото: разрешены только файлы, загруженные на сайт" },
      { status: 400 }
    );
  }

  const tags = normalizeTags(body.tags);
  const social_links = normalizeSocialLinks(body.social_links);

  const author = trimText(body.author, 200);
  const bar_name = trimText(body.bar_name, 200);
  const bar_city = trimText(body.bar_city, 120);
  const bar_description = trimText(body.bar_description, 2000);

  try {
    await db.query(
      `INSERT INTO prep_submissions (
        user_id, category_id, name, slug, composition, ingredients, tags, image_url,
        author, bar_name, bar_city, bar_description, social_links,
        photo_rights_confirmed, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7, $8,
        $9, $10, $11, $12, $13::jsonb,
        true, 'pending'
      )`,
      [
        auth.userId,
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
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Prep submit error:", err);
    const mapped = userMessageFromDbError(err);
    if (mapped) return NextResponse.json({ ok: false, error: mapped.message }, { status: mapped.status });
    return NextResponse.json(
      { ok: false, error: "Ошибка сохранения. Если проблема повторяется, сообщите администратору." },
      { status: 500 }
    );
  }
}

