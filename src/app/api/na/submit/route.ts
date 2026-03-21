import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isAllowedKnowledgeMediaUrl } from "@/lib/sanitizeArticleHtml";
import { userMessageFromDbError } from "@/lib/pg-api-errors";
import { checkRateLimit, submitRateLimiterByUser } from "@/lib/rateLimit";
import {
  trimText,
  normalizeNaFlavorProfile,
  normalizeNaTags,
  buildNaCategoryPayload,
  normalizeNaSlugInput,
  parseAmountNumeric,
} from "@/lib/naPayloadHelpers";

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

  const slug = normalizeNaSlugInput(body.slug);
  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Укажите slug URL (латиница/кириллица, дефисы)" },
      { status: 400 }
    );
  }

  const categoryIdRaw = body.category_id ?? body.categoryId;
  const categoryId = parseInt(String(categoryIdRaw ?? ""), 10);
  if (Number.isNaN(categoryId) || categoryId <= 0) {
    return NextResponse.json({ ok: false, error: "Выберите категорию ингредиента" }, { status: 400 });
  }

  const catRes = await db.query(`SELECT id, slug FROM na_categories WHERE id = $1`, [categoryId]);
  if (catRes.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 400 });
  }
  const categorySlug = String((catRes.rows[0] as { slug: string }).slug);

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

  const description = trimText(body.description, 8000);
  const subcategory_text = trimText(body.subcategory_text, 300);
  const tags = normalizeNaTags(body.tags);
  const producer = trimText(body.producer, 200);
  const country = trimText(body.country, 120);
  const amount_numeric = parseAmountNumeric(body.amount_numeric ?? body.amount);
  const amount_unit = trimText(body.amount_unit, 32);
  const taste_description = trimText(body.taste_description, 8000);
  const flavor_profile = normalizeNaFlavorProfile(body.flavor_profile);
  const usage_in_drinks = trimText(body.usage_in_drinks, 8000);
  const usage_in_food = trimText(body.usage_in_food, 8000);
  const about_brand = trimText(body.about_brand, 12000);
  const interesting_facts = trimText(body.interesting_facts, 8000);

  const { category_specific, category_extra } = buildNaCategoryPayload(categorySlug, body);

  if (
    !description &&
    !taste_description &&
    !usage_in_drinks &&
    !producer &&
    !country
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Добавьте краткое описание, текст вкуса, применение в напитках, производителя или страну",
      },
      { status: 400 }
    );
  }

  try {
    await db.query(
      `INSERT INTO na_submissions (
        user_id, category_id, name, slug, image_url, description, subcategory_text, tags,
        producer, country, amount_numeric, amount_unit, taste_description, flavor_profile,
        usage_in_drinks, usage_in_food, about_brand, interesting_facts,
        category_specific, category_extra, practice_test_id, related_knowledge_article_id,
        photo_rights_confirmed, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14::jsonb,
        $15, $16, $17, $18,
        $19::jsonb, $20::jsonb, $21, $22,
        true, 'pending'
      )`,
      [
        auth.userId,
        categoryId,
        name,
        slug,
        image_url,
        description,
        subcategory_text,
        tags,
        producer,
        country,
        amount_numeric,
        amount_unit,
        taste_description,
        JSON.stringify(flavor_profile),
        usage_in_drinks,
        usage_in_food,
        about_brand,
        interesting_facts,
        JSON.stringify(category_specific),
        JSON.stringify(category_extra),
        practice_test_id,
        related_knowledge_article_id,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("NA submit error:", err);
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
