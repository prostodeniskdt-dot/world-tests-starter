import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Требуется авторизация" },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Невалидный токен" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const excerpt = body?.excerpt ? String(body.excerpt).trim() : null;
    const content = String(body?.content || "").trim();
    let slug = String(body?.slug || "").trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0400-\u04FF-]/g, "");

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: "Заполните заголовок и содержание" },
        { status: 400 }
      );
    }

    if (!slug) slug = `article-${Date.now()}`;

    await db.query(
      `INSERT INTO article_submissions (user_id, title, slug, excerpt, content, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [payload.userId, title, slug, excerpt, content]
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
