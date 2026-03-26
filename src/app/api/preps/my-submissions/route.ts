import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const status = req.nextUrl.searchParams.get("status")?.trim() || "pending";
  const allowed = new Set(["pending", "approved", "rejected"]);
  const st = allowed.has(status) ? status : "pending";

  try {
    const { rows } = await db.query(
      `SELECT id, status, name, slug, image_url, category_id, created_at, updated_at
       FROM prep_submissions
       WHERE user_id = $1 AND status = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [auth.userId, st]
    );
    return NextResponse.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Preps my-submissions error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка загрузки", items: [] }, { status: 500 });
  }
}

