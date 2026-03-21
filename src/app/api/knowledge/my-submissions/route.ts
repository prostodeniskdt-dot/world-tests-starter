import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { rows } = await db.query(
      `SELECT s.id, s.title, s.slug, s.excerpt, s.status, s.created_at, s.updated_at,
              s.category_id, s.cover_image_url,
              c.name AS category_name
       FROM article_submissions s
       LEFT JOIN knowledge_categories c ON c.id = s.category_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [auth.userId]
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("My submissions error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки" }, { status: 500 });
  }
}
