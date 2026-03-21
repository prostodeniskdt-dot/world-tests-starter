import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const categoryId = searchParams.get("category");
  const search = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  try {
    let where = " WHERE a.is_published = true";
    const values: unknown[] = [];
    let i = 1;

    if (categoryId) {
      where += ` AND a.category_id = $${i}`;
      values.push(parseInt(categoryId, 10));
      i++;
    }

    if (search) {
      where += ` AND (a.title ILIKE $${i} OR a.excerpt ILIKE $${i} OR a.content ILIKE $${i})`;
      values.push(`%${search}%`);
      i++;
    }

    const countValues = [...values];
    values.push(limit, offset);

    const [rowsResult, countResult] = await Promise.all([
      db.query(
        `SELECT a.id, a.title, a.slug, a.excerpt, a.author_name, a.category_id, a.cover_image_url, a.created_at,
                c.name AS category_name, c.slug AS category_slug
         FROM knowledge_articles a
         LEFT JOIN knowledge_categories c ON c.id = a.category_id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        values
      ),
      db.query(`SELECT COUNT(*) AS c FROM knowledge_articles a${where}`, countValues),
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
