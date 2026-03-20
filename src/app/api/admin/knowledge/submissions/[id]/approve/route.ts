import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const submissionId = parseInt(id, 10);
  if (isNaN(submissionId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const { rows } = await db.query(
      "SELECT * FROM article_submissions WHERE id = $1 AND status = 'pending'",
      [submissionId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Заявка не найдена" }, { status: 404 });
    }

    const sub = rows[0] as Record<string, unknown>;
    const userId = sub.user_id as string;

    let authorName: string | null = null;
    const userRows = await db.query(
      "SELECT first_name, last_name FROM users WHERE id = $1",
      [userId]
    );
    if (userRows.rows.length > 0) {
      const u = userRows.rows[0] as { first_name: string; last_name: string };
      authorName = [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
    }

    let slug = sub.slug as string;
    const existing = await db.query(
      "SELECT id FROM knowledge_articles WHERE slug = $1",
      [slug]
    );
    if (existing.rows.length > 0) {
      slug = `${slug}-${submissionId}`;
    }

    await db.query("BEGIN");

    await db.query(
      `INSERT INTO knowledge_articles (title, slug, excerpt, content, author_id, author_name, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [
        sub.title,
        slug,
        sub.excerpt,
        sub.content,
        userId,
        authorName,
      ]
    );

    await db.query(
      `UPDATE article_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
      [adminResult.userId, submissionId]
    );

    await db.query("COMMIT");

    return NextResponse.json({ ok: true });
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("Approve submission error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка" },
      { status: 500 }
    );
  }
}
