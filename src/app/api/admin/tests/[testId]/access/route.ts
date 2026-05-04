import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";

export async function GET(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { testId } = params;

  try {
    const { rows: testRows } = await db.query(`SELECT id FROM tests WHERE id = $1`, [testId]);
    if (testRows.length === 0) {
      return NextResponse.json({ ok: false, error: "Тест не найден" }, { status: 404 });
    }

    const { rows } = await db.query(
      `SELECT a.user_id, a.created_at, u.email, u.first_name, u.last_name
       FROM test_user_access a
       JOIN users u ON u.id = a.user_id
       WHERE a.test_id = $1
       ORDER BY a.created_at DESC`,
      [testId]
    );

    const users = rows.map((r: any) => ({
      userId: r.user_id,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ ok: true, users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

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

  const email = typeof (body as { email?: string }).email === "string" ? (body as { email: string }).email.trim() : "";
  if (!email) {
    return NextResponse.json({ ok: false, error: "Укажите email" }, { status: 400 });
  }

  try {
    const { rows: testRows } = await db.query(`SELECT id FROM tests WHERE id = $1`, [testId]);
    if (testRows.length === 0) {
      return NextResponse.json({ ok: false, error: "Тест не найден" }, { status: 404 });
    }

    const { rows: userRows } = await db.query(
      `SELECT id FROM users WHERE lower(trim(email)) = lower(trim($1)) LIMIT 1`,
      [email]
    );
    if (userRows.length === 0) {
      return NextResponse.json({ ok: false, error: "Пользователь с таким email не найден" }, { status: 404 });
    }

    const targetUserId = userRows[0].id as string;

    await db.query(
      `INSERT INTO test_user_access (test_id, user_id, granted_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (test_id, user_id) DO NOTHING`,
      [testId, targetUserId, adminCheck.userId]
    );

    return NextResponse.json({ ok: true, userId: targetUserId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
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

  const userId = (body as { userId?: string }).userId;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ ok: false, error: "Укажите userId" }, { status: 400 });
  }

  try {
    await db.query(`DELETE FROM test_user_access WHERE test_id = $1 AND user_id = $2`, [testId, userId]);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
