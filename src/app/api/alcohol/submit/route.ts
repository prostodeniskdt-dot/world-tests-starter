import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isAllowedKnowledgeMediaUrl } from "@/lib/sanitizeArticleHtml";
import { userMessageFromDbError } from "@/lib/pg-api-errors";
import { checkRateLimit, submitRateLimiterByUser } from "@/lib/rateLimit";
import { slugify } from "@/lib/slugify";
import { normalizeSensoryMatrix } from "@/lib/sensoryMatrix";
import { normalizeDrinkType } from "@/lib/alcoholDrinkTypes";

function trimText(v: unknown, max: number): string | null {
  const s = v != null ? String(v).trim() : "";
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
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

function parseAbv(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return Math.round(n * 10) / 10;
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
          "Подтвердите права на фото: только свои материалы или полное разрешение на публикацию.",
      },
      { status: 400 }
    );
  }

  const name = trimText(body.name, 200);
  if (!name) {
    return NextResponse.json({ ok: false, error: "Укажите название" }, { status: 400 });
  }

  const drinkType = normalizeDrinkType(body.drink_type);

  let slug = trimText(body.slug, 120) || slugify(name);
  slug = slugify(slug);
  if (!slug) slug = `alcohol-${Date.now()}`;

  const categoryIdRaw = body.category_id ?? body.categoryId;
  let categoryId: number | null = null;
  if (categoryIdRaw != null && categoryIdRaw !== "") {
    const n = parseInt(String(categoryIdRaw), 10);
    if (!Number.isNaN(n) && n > 0) {
      const cat = await db.query(`SELECT id FROM alcohol_categories WHERE id = $1`, [n]);
      if (cat.rows.length === 0) {
        return NextResponse.json({ ok: false, error: "Категория каталога не найдена" }, { status: 400 });
      }
      categoryId = n;
    }
  }

  const imageRaw = body.image_url != null ? String(body.image_url).trim() : "";
  const image_url = imageRaw || null;
  if (image_url && !isAllowedKnowledgeMediaUrl(image_url)) {
    return NextResponse.json(
      { ok: false, error: "Фото: разрешены только файлы, загруженные на сайт" },
      { status: 400 }
    );
  }

  let practice_test_id: string | null = null;
  const ptRaw = body.practice_test_id != null ? String(body.practice_test_id).trim() : "";
  if (ptRaw) {
    const t = await db.query(
      `SELECT id FROM tests WHERE id = $1 AND is_published = true LIMIT 1`,
      [ptRaw]
    );
    if (t.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Тест не найден или не опубликован" },
        { status: 400 }
      );
    }
    practice_test_id = ptRaw;
  }

  let related_knowledge_article_id: number | null = null;
  const artRaw = body.related_knowledge_article_id ?? body.related_article_id;
  if (artRaw != null && artRaw !== "") {
    const aid = parseInt(String(artRaw), 10);
    if (!Number.isNaN(aid) && aid > 0) {
      const a = await db.query(
        `SELECT id FROM knowledge_articles WHERE id = $1 AND is_published = true LIMIT 1`,
        [aid]
      );
      if (a.rows.length === 0) {
        return NextResponse.json(
          { ok: false, error: "Статья не найдена или не опубликована" },
          { status: 400 }
        );
      }
      related_knowledge_article_id = aid;
    }
  }

  const sensory_matrix = normalizeSensoryMatrix(body.sensory_matrix, drinkType);
  const flavor_profile = normalizeFlavorProfile(body.flavor_profile);
  const abv = parseAbv(body.abv);

  const description = trimText(body.description, 8000);
  const history = trimText(body.history, 8000);
  const country = trimText(body.country, 120);
  const region = trimText(body.region, 200);
  const producer = trimText(body.producer, 200);
  const primaryRaw =
    body.primary_ingredient != null && String(body.primary_ingredient).trim() !== ""
      ? body.primary_ingredient
      : body.grape_or_raw_material;
  const primary_ingredient = trimText(primaryRaw, 500);
  const additional_ingredients = trimText(body.additional_ingredients, 2000);
  const volume = trimText(body.volume, 80);
  const serving_temperature = trimText(body.serving_temperature, 120);
  const recommended_glassware = trimText(body.recommended_glassware, 300);
  const serve_style = trimText(body.serve_style, 300);
  const aging_method = trimText(body.aging_method, 4000);
  const production_method = trimText(body.production_method, 4000);
  const interesting_facts = trimText(body.interesting_facts, 8000);
  const about_brand = trimText(body.about_brand, 12000);
  const gastronomy = trimText(body.gastronomy, 4000);
  const wine_or_spirit_style = trimText(body.wine_or_spirit_style, 2000);
  const tasting_notes = trimText(body.tasting_notes, 8000);
  const vineyards_or_origin_detail = trimText(body.vineyards_or_origin_detail, 8000);
  const food_usage = trimText(body.food_usage, 8000);

  if (
    !description &&
    !history &&
    !country &&
    !producer &&
    !primary_ingredient &&
    !tasting_notes
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Добавьте хотя бы краткое описание, страну/производителя, основное сырьё или дегустационные заметки",
      },
      { status: 400 }
    );
  }

  try {
    await db.query(
      `INSERT INTO alcohol_submissions (
        user_id, category_id, drink_type, name, slug, image_url, description, history, country, region, producer, abv,
        flavor_profile, sensory_matrix, primary_ingredient, additional_ingredients, volume, serving_temperature,
        recommended_glassware, serve_style,
        aging_method, production_method, interesting_facts, about_brand, gastronomy,
        wine_or_spirit_style, tasting_notes, vineyards_or_origin_detail, food_usage,
        practice_test_id, related_knowledge_article_id, photo_rights_confirmed, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13::jsonb, $14::jsonb, $15, $16, $17, $18,
        $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, $28, $29,
        $30, $31, true, 'pending'
      )`,
      [
        auth.userId,
        categoryId,
        drinkType,
        name,
        slug,
        image_url,
        description,
        history,
        country,
        region,
        producer,
        abv,
        JSON.stringify(flavor_profile),
        JSON.stringify(sensory_matrix),
        primary_ingredient,
        additional_ingredients,
        volume,
        serving_temperature,
        recommended_glassware,
        serve_style,
        aging_method,
        production_method,
        interesting_facts,
        about_brand,
        gastronomy,
        wine_or_spirit_style,
        tasting_notes,
        vineyards_or_origin_detail,
        food_usage,
        practice_test_id,
        related_knowledge_article_id,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Alcohol submit error:", err);
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
