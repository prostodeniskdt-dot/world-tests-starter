import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-middleware";
import { db, withTransaction } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminResult = await requireAdmin(req);
  if (adminResult instanceof NextResponse) return adminResult;

  const { id } = await params;
  const submissionId = parseInt(id, 10);
  if (Number.isNaN(submissionId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  let categoryIdOverride: number | undefined;
  try {
    const ct = req.headers.get("content-type");
    if (ct?.includes("application/json")) {
      const body = await req.json();
      if (body?.categoryId != null && body.categoryId !== "") {
        const n = parseInt(String(body.categoryId), 10);
        if (!Number.isNaN(n) && n > 0) categoryIdOverride = n;
      }
    }
  } catch {
    /* пустое тело */
  }

  try {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM article_submissions WHERE id = $1 AND status = 'pending'",
        [submissionId]
      );

      if (rows.length === 0) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });
      }

      const sub = rows[0] as Record<string, unknown>;
      const userId = sub.user_id as string;

      let authorName: string | null = null;
      const userRows = await client.query(
        "SELECT first_name, last_name FROM users WHERE id = $1",
        [userId]
      );
      if (userRows.rows.length > 0) {
        const u = userRows.rows[0] as { first_name: string; last_name: string };
        authorName = [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
      }

      let slug = sub.slug as string;
      const existing = await client.query("SELECT id FROM knowledge_articles WHERE slug = $1", [slug]);
      if (existing.rows.length > 0) {
        slug = `${slug}-${submissionId}`;
      }

      let categoryId =
        categoryIdOverride !== undefined
          ? categoryIdOverride
          : (sub.category_id as number | null);
      if (categoryId == null || categoryId < 1) {
        throw Object.assign(new Error("NO_CATEGORY"), { code: "NO_CATEGORY" });
      }

      const catCheck = await client.query(`SELECT id FROM knowledge_categories WHERE id = $1`, [categoryId]);
      if (catCheck.rows.length === 0) {
        throw Object.assign(new Error("BAD_CATEGORY"), { code: "BAD_CATEGORY" });
      }

      const coverUrl = (sub.cover_image_url as string | null) || null;

      await client.query(
        `INSERT INTO knowledge_articles (title, slug, excerpt, content, author_id, author_name, is_published, category_id, cover_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
        [sub.title, slug, sub.excerpt, sub.content, userId, authorName, categoryId, coverUrl]
      );

      await client.query(
        `UPDATE article_submissions SET status = 'approved', reviewed_at = now(), reviewed_by = $1 WHERE id = $2`,
        [adminResult.userId, submissionId]
      );
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Заявка не найдена" }, { status: 404 });
    }
    if (code === "NO_CATEGORY") {
      return NextResponse.json(
        { ok: false, error: "Укажите категорию перед публикацией" },
        { status: 400 }
      );
    }
    if (code === "BAD_CATEGORY") {
      return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 400 });
    }
    console.error("Approve submission error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
