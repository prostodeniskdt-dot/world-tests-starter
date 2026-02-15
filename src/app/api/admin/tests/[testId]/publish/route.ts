import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";

// POST - опубликовать/снять тест
export async function POST(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { testId } = params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const { published } = body;
  if (typeof published !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "Укажите published: true/false" },
      { status: 400 }
    );
  }

  try {
    const { rowCount } = await db.query(
      `UPDATE tests SET is_published = $1 WHERE id = $2`,
      [published, testId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Тест не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, published });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
