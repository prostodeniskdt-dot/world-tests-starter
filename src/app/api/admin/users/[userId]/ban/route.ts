import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";
import { z } from "zod";

const banSchema = z.object({
  banned: z.boolean(),
  bannedUntil: z.string().optional().nullable(), // ISO date string или null для постоянного бана
});

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  // Проверяем админские права
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const { userId } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const parsed = banSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { banned, bannedUntil } = parsed.data;

  // Проверяем, что пользователь существует
  const { rows: userRows } = await db.query(
    `SELECT id, email, is_admin FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  const user = userRows[0];
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Пользователь не найден" },
      { status: 404 }
    );
  }

  // Нельзя забанить другого админа
  if (user.is_admin && banned) {
    return NextResponse.json(
      { ok: false, error: "Нельзя забанить администратора" },
      { status: 403 }
    );
  }

  // Обновляем статус бана
  const bannedUntilValue = banned ? (bannedUntil || null) : null;

  try {
    const { rows: updatedRows } = await db.query(
      `UPDATE users SET is_banned = $1, banned_until = $2 WHERE id = $3
       RETURNING id, email, is_banned, banned_until`,
      [banned, bannedUntilValue, userId]
    );

    const updatedUser = updatedRows[0];

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isBanned: updatedUser.is_banned,
        bannedUntil: updatedUser.banned_until,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Ошибка обновления: " + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
