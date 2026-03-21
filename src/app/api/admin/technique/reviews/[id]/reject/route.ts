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
  const reviewId = parseInt(id, 10);
  if (Number.isNaN(reviewId)) {
    return NextResponse.json({ ok: false, error: "Неверный ID" }, { status: 400 });
  }

  try {
    const result = await db.query(
      `UPDATE equipment_reviews SET status = 'rejected', reviewed_at = now(), reviewed_by = $1 WHERE id = $2 AND status = 'pending'`,
      [adminResult.userId, reviewId]
    );
    if (!result.rowCount) {
      return NextResponse.json({ ok: false, error: "Отзыв не найден" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reject equipment review error:", err);
    return NextResponse.json({ ok: false, error: "Ошибка" }, { status: 500 });
  }
}
