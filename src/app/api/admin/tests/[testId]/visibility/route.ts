import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";

export async function POST(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { testId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Невалидный JSON" }, { status: 400 });
  }

  const visibility = (body as { visibility?: string }).visibility;
  if (visibility !== "public" && visibility !== "restricted") {
    return NextResponse.json(
      { ok: false, error: "Укажите visibility: \"public\" или \"restricted\"" },
      { status: 400 }
    );
  }

  try {
    const { rowCount } = await db.query(`UPDATE tests SET visibility = $1 WHERE id = $2`, [
      visibility,
      testId,
    ]);
    if (rowCount === 0) {
      return NextResponse.json({ ok: false, error: "Тест не найден" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, visibility });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
