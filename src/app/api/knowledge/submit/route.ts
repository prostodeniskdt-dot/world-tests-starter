import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { sanitizeArticleHtml, isAllowedKnowledgeMediaUrl } from "@/lib/sanitizeArticleHtml";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const excerptRaw = body?.excerpt != null ? String(body.excerpt).trim() : "";
    const excerpt = excerptRaw
      ? sanitizeHtml(excerptRaw, { allowedTags: [], allowedAttributes: {} })
      : null;
    const contentRaw = String(body?.content || "").trim();
    const content = sanitizeArticleHtml(contentRaw);
    const textOnly = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const hasImage = /<img[\s>]/i.test(content);
    let slug = String(body?.slug || "").trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0400-\u04FF-]/g, "");

    const categoryId = parseInt(String(body?.category_id ?? body?.categoryId ?? ""), 10);
    if (Number.isNaN(categoryId) || categoryId < 1) {
      return NextResponse.json({ ok: false, error: "Выберите категорию" }, { status: 400 });
    }

    const coverRaw = body?.cover_image_url != null ? String(body.cover_image_url).trim() : "";
    const cover_image_url = coverRaw || null;
    if (cover_image_url && !isAllowedKnowledgeMediaUrl(cover_image_url)) {
      return NextResponse.json(
        { ok: false, error: "Некорректный URL обложки (разрешены только файлы из хранилища сайта)" },
        { status: 400 }
      );
    }

    if (!title || !content || (!textOnly && !hasImage)) {
      return NextResponse.json(
        { ok: false, error: "Заполните заголовок и содержание статьи" },
        { status: 400 }
      );
    }

    if (!slug) slug = `article-${Date.now()}`;

    const cat = await db.query(`SELECT id FROM knowledge_categories WHERE id = $1`, [categoryId]);
    if (cat.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 400 });
    }

    await db.query(
      `INSERT INTO article_submissions (user_id, title, slug, excerpt, content, status, category_id, cover_image_url)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)`,
      [auth.userId, title, slug, excerpt, content, categoryId, cover_image_url]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Knowledge submit error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка сохранения" },
      { status: 500 }
    );
  }
}
