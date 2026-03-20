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
    await db.query(
      `UPDATE article_submissions SET status = 'rejected', reviewed_at = now(), reviewed_by = $1 WHERE id = $2 AND status = 'pending'`,
      [adminResult.userId, submissionId]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reject submission error:", err);
    return NextResponse.json(
      { ok: false, error: "Ошибка" },
      { status: 500 }
    );
  }
}
