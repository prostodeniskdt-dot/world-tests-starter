import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isAllowedKnowledgeMediaUrl } from "@/lib/sanitizeArticleHtml";
import { userMessageFromDbError } from "@/lib/pg-api-errors";
import { checkRateLimit, submitRateLimiterByUser } from "@/lib/rateLimit";
import {
  trimText,
  normalizeSlugInput,
  normalizeTags,
  normalizeGalleryUrls,
  normalizeKeySpecs,
  normalizePurchaseLinks,
  normalizePriceSegment,
} from "@/lib/techniquePayloadHelpers";

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
    return NextResponse.json({ ok: false, error: "Укажите название модели" }, { status: 400 });
  }

  const slug = normalizeSlugInput(body.slug);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Укажите slug URL" }, { status: 400 });
  }

  const categoryIdRaw = body.category_id ?? body.categoryId;
  let categoryId: number | null = null;
  if (categoryIdRaw != null && categoryIdRaw !== "") {
    const n = parseInt(String(categoryIdRaw), 10);
    if (!Number.isNaN(n) && n > 0) {
      const c = await db.query(`SELECT id FROM equipment_categories WHERE id = $1`, [n]);
      if (c.rows.length === 0) {
        return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 400 });
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

  const gallery_urls = normalizeGalleryUrls(body.gallery_urls);
  for (const u of gallery_urls) {
    if (!isAllowedKnowledgeMediaUrl(u)) {
      return NextResponse.json({ ok: false, error: "Недопустимый URL в галерее" }, { status: 400 });
    }
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
  const producer = trimText(body.producer, 200);
  const price_segment = normalizePriceSegment(body.price_segment ?? body.priceSegment);
  const price_range = trimText(body.price_range ?? body.priceRange, 200);
  const purchase_links = normalizePurchaseLinks(body.purchase_links ?? body.purchaseLinks);
  const audience = trimText(body.audience, 500);
  const experience_pros = trimText(body.experience_pros ?? body.experiencePros, 8000);
  const experience_cons = trimText(body.experience_cons ?? body.experienceCons, 8000);
  const ideal_for = trimText(body.ideal_for ?? body.idealFor, 4000);
  const not_suitable_for = trimText(body.not_suitable_for ?? body.notSuitableFor, 4000);
  const key_specs = normalizeKeySpecs(body.key_specs ?? body.keySpecs);
  const recommendations = trimText(body.recommendations, 8000);
  const tags = normalizeTags(body.tags);

  if (!description && !experience_pros && !recommendations) {
    return NextResponse.json(
      {
        ok: false,
        error: "Добавьте описание и/или опыт использования (плюсы) и/или рекомендации",
      },
      { status: 400 }
    );
  }

  try {
    await db.query(
      `INSERT INTO equipment_submissions (
        user_id, category_id, name, slug, image_url, gallery_urls, description, producer,
        price_segment, price_range, purchase_links, audience,
        experience_pros, experience_cons, ideal_for, not_suitable_for, key_specs, recommendations, tags,
        related_knowledge_article_id, photo_rights_confirmed, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7, $8,
        $9, $10, $11::jsonb, $12,
        $13, $14, $15, $16, $17::jsonb, $18, $19,
        $20, true, 'pending'
      )`,
      [
        auth.userId,
        categoryId,
        name,
        slug,
        image_url,
        JSON.stringify(gallery_urls),
        description,
        producer,
        price_segment,
        price_range,
        JSON.stringify(purchase_links),
        audience,
        experience_pros,
        experience_cons,
        ideal_for,
        not_suitable_for,
        JSON.stringify(key_specs),
        recommendations,
        tags,
        related_knowledge_article_id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Equipment submit error:", err);
    const mapped = userMessageFromDbError(err);
    if (mapped) {
      return NextResponse.json({ ok: false, error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}
