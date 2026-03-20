import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const categoryId = searchParams.get("category");
  const search = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  try {
    let where = " WHERE is_published = true";
    const values: unknown[] = [];
    let i = 1;

    if (categoryId) {
      where += ` AND category_id = $${i}`;
      values.push(parseInt(categoryId, 10));
      i++;
    }

    if (search) {
      where += ` AND (title ILIKE $${i} OR excerpt ILIKE $${i} OR content ILIKE $${i})`;
      values.push(`%${search}%`);
      i++;
    }

    const countValues = [...values];
    values.push(limit, offset);

    const [rowsResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, title, slug, excerpt, author_name, category_id, created_at
         FROM knowledge_articles${where}
         ORDER BY created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        values
      ),
      db.query(`SELECT COUNT(*) AS c FROM knowledge_articles${where}`, countValues),
    ]);

    const total = parseInt((countResult.rows[0] as { c: string })?.c || "0", 10);

    return NextResponse.json({
      ok: true,
      items: rowsResult.rows,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Knowledge list error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
