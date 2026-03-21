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
  normalizeDifficulty,
  normalizeVideoUrl,
  normalizeSlugArray,
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
    return NextResponse.json({ ok: false, error: "Укажите название приёма" }, { status: 400 });
  }

  const slug = normalizeSlugInput(body.slug);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Укажите slug URL" }, { status: 400 });
  }

  const categoryId = parseInt(String(body.category_id ?? body.categoryId ?? ""), 10);
  if (Number.isNaN(categoryId) || categoryId <= 0) {
    return NextResponse.json({ ok: false, error: "Выберите категорию" }, { status: 400 });
  }
  const cat = await db.query(`SELECT id FROM technique_guide_categories WHERE id = $1`, [categoryId]);
  if (cat.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 400 });
  }

  const gallery_urls = normalizeGalleryUrls(body.gallery_urls ?? body.galleryUrls);
  for (const u of gallery_urls) {
    if (!isAllowedKnowledgeMediaUrl(u)) {
      return NextResponse.json({ ok: false, error: "Недопустимый URL в галерее" }, { status: 400 });
    }
  }

  const video_url = normalizeVideoUrl(body.video_url ?? body.videoUrl);
  if (body.video_url != null && String(body.video_url).trim() && !video_url) {
    return NextResponse.json(
      { ok: false, error: "Видео: укажите корректную https-ссылку (YouTube, Vimeo и т.п.)" },
      { status: 400 }
    );
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

  const difficulty = normalizeDifficulty(body.difficulty);
  const short_description = trimText(body.short_description ?? body.shortDescription, 500);
  const instruction_text = trimText(body.instruction_text ?? body.instructionText, 50000);
  const typical_mistakes = trimText(body.typical_mistakes ?? body.typicalMistakes, 8000);
  const tips = trimText(body.tips, 8000);
  const cocktail_slugs = normalizeSlugArray(body.cocktail_slugs ?? body.cocktailSlugs);
  const na_slugs = normalizeSlugArray(body.na_slugs ?? body.naSlugs);
  const alcohol_slugs = normalizeSlugArray(body.alcohol_slugs ?? body.alcoholSlugs);
  const tags = normalizeTags(body.tags);

  if (!short_description && !instruction_text) {
    return NextResponse.json(
      { ok: false, error: "Добавьте краткое описание и/или пошаговую инструкцию" },
      { status: 400 }
    );
  }

  try {
    await db.query(
      `INSERT INTO technique_guide_submissions (
        user_id, category_id, name, slug, difficulty, short_description, instruction_text, video_url,
        gallery_urls, typical_mistakes, tips, cocktail_slugs, na_slugs, alcohol_slugs, tags,
        related_knowledge_article_id, photo_rights_confirmed, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::jsonb, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb, $15,
        $16, true, 'pending'
      )`,
      [
        auth.userId,
        categoryId,
        name,
        slug,
        difficulty,
        short_description,
        instruction_text,
        video_url,
        JSON.stringify(gallery_urls),
        typical_mistakes,
        tips,
        JSON.stringify(cocktail_slugs),
        JSON.stringify(na_slugs),
        JSON.stringify(alcohol_slugs),
        tags,
        related_knowledge_article_id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Technique guide submit error:", err);
    const mapped = userMessageFromDbError(err);
    if (mapped) {
      return NextResponse.json({ ok: false, error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json({ ok: false, error: "Ошибка сохранения" }, { status: 500 });
  }
}
