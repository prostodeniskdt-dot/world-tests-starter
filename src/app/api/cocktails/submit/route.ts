import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isAllowedKnowledgeMediaUrl } from "@/lib/sanitizeArticleHtml";
import { userMessageFromDbError } from "@/lib/pg-api-errors";
import { checkRateLimit, submitRateLimiterByUser } from "@/lib/rateLimit";
import { slugify } from "@/lib/slugify";

function trimText(v: unknown, max: number): string | null {
  const s = v != null ? String(v).trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function parseScale(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  if (Number.isNaN(n) || n < 0 || n > 10) return null;
  return n;
}

function normalizeIngredients(
  raw: unknown
): { name: string; amount: string; alcohol_product_slug?: string }[] | null {
  if (!Array.isArray(raw)) return null;
  const out: { name: string; amount: string; alcohol_product_slug?: string }[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const name = sanitizeHtml(String(o.name ?? "").trim(), { allowedTags: [], allowedAttributes: {} });
    const amount = sanitizeHtml(String(o.amount ?? "").trim(), { allowedTags: [], allowedAttributes: {} });
    if (!name && !amount) continue;
    const slugRaw = o.alcohol_product_slug != null ? String(o.alcohol_product_slug).trim() : "";
    const alcohol_product_slug = slugRaw
      ? sanitizeHtml(slugRaw, { allowedTags: [], allowedAttributes: {} }).slice(0, 120) || undefined
      : undefined;
    const entry: { name: string; amount: string; alcohol_product_slug?: string } = {
      name: name.slice(0, 200),
      amount: amount.slice(0, 120),
    };
    if (alcohol_product_slug) entry.alcohol_product_slug = alcohol_product_slug;
    out.push(entry);
    if (out.length >= 40) break;
  }
  return out;
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const t of raw) {
    const s = sanitizeHtml(String(t ?? "").trim(), { allowedTags: [], allowedAttributes: {} });
    if (s && out.length < 24) out.push(s.slice(0, 64));
  }
  return out;
}

function normalizeGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const u of raw) {
    const url = String(u ?? "").trim();
    if (!url || !isAllowedKnowledgeMediaUrl(url)) continue;
    out.push(url);
    if (out.length >= 12) break;
  }
  return out;
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

function normalizeFlavorProfile(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = k.slice(0, 48);
    if (!key) continue;
    const n = Number(v);
    if (Number.isFinite(n)) out[key] = Math.min(100, Math.max(0, Math.round(n)));
    if (Object.keys(out).length >= 20) break;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const rl = await checkRateLimit(submitRateLimiterByUser, auth.userId);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Слишком много отправок. Подождите минуту." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный формат запроса (тело не JSON)" },
      { status: 400 }
    );
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
  if (!name) {
    return NextResponse.json({ ok: false, error: "Укажите название коктейля" }, { status: 400 });
  }

  let slug = trimText(body.slug, 120) || slugify(name);
  slug = slugify(slug);
  if (!slug) slug = `cocktail-${Date.now()}`;

  const ingredients = normalizeIngredients(body.ingredients);
  const instructions = trimText(body.instructions, 8000);
  if ((!ingredients || ingredients.length === 0) && !instructions) {
    return NextResponse.json(
      { ok: false, error: "Добавьте ингредиенты или описание приготовления" },
      { status: 400 }
    );
  }

  const imageRaw = body.image_url != null ? String(body.image_url).trim() : "";
  const image_url = imageRaw || null;
  if (image_url && !isAllowedKnowledgeMediaUrl(image_url)) {
    return NextResponse.json(
      { ok: false, error: "Главное фото: разрешены только файлы, загруженные на сайт" },
      { status: 400 }
    );
  }

  const gallery_urls = normalizeGallery(body.gallery_urls);

  const description = trimText(body.description, 4000);
  const method = trimText(body.method, 200);
  const glass = trimText(body.glass, 300);
  const garnish = trimText(body.garnish, 500);
  const ice = trimText(body.ice, 120);
  const cordials_recipe = trimText(body.cordials_recipe, 2000);
  const bar_name = trimText(body.bar_name, 200);
  const bar_city = trimText(body.bar_city, 120);
  const bar_description = trimText(body.bar_description, 2000);
  const author = trimText(body.author, 200);
  const history = trimText(body.history, 8000);
  const allergens = trimText(body.allergens, 2000);
  const nutrition_note = trimText(body.nutrition_note, 2000);
  const alcohol_content_note = trimText(body.alcohol_content_note, 2000);

  const strength_scale = parseScale(body.strength_scale);
  const taste_sweet_dry_scale = parseScale(body.taste_sweet_dry_scale);

  const tags = normalizeTags(body.tags);
  const social_links = normalizeSocialLinks(body.social_links);
  const flavor_profile = normalizeFlavorProfile(body.flavor_profile);

  const ingredientsJson = JSON.stringify(ingredients && ingredients.length > 0 ? ingredients : []);
  const galleryJson = JSON.stringify(gallery_urls);
  const socialJson = JSON.stringify(social_links);
  const flavorJson = JSON.stringify(flavor_profile);

  try {
    await db.query(
      `INSERT INTO cocktail_submissions (
        user_id, name, slug, description, method, glass, garnish, ice,
        ingredients, instructions, cordials_recipe, bar_name, bar_city, bar_description, author,
        social_links, flavor_profile, tags, image_url, gallery_urls,
        history, allergens, strength_scale, taste_sweet_dry_scale, nutrition_note, alcohol_content_note,
        photo_rights_confirmed, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::jsonb, $10, $11, $12, $13, $14, $15,
        $16::jsonb, $17::jsonb, $18, $19, $20::jsonb,
        $21, $22, $23, $24, $25, $26,
        true, 'pending'
      )`,
      [
        auth.userId,
        name,
        slug,
        description,
        method,
        glass,
        garnish,
        ice,
        ingredientsJson,
        instructions,
        cordials_recipe,
        bar_name,
        bar_city,
        bar_description,
        author,
        socialJson,
        flavorJson,
        tags,
        image_url,
        galleryJson,
        history,
        allergens,
        strength_scale,
        taste_sweet_dry_scale,
        nutrition_note,
        alcohol_content_note,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cocktail submit error:", err);
    const mapped = userMessageFromDbError(err);
    if (mapped) {
      return NextResponse.json({ ok: false, error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json(
      { ok: false, error: "Ошибка сохранения. Если проблема повторяется, сообщите администратору." },
      { status: 500 }
    );
  }
}
