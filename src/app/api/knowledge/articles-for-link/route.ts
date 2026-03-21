import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Публичный список статей для привязки к карточке алкоголя (только опубликованные). */
export async function GET() {
  try {
    const { rows } = await db.query(
      `SELECT id, title, slug FROM knowledge_articles WHERE is_published = true ORDER BY title ASC LIMIT 300`
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("articles-for-link error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки", items: [] }, { status: 500 });
  }
}
