import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  // Проверяем авторизацию
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse || !authResult.ok) {
    return authResult;
  }

  const { userId } = authResult;

  // Получаем профиль пользователя (только свой профиль)
  const { rows: userRows } = await db.query(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );

  const user = userRows[0];
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Пользователь не найден" },
      { status: 404 }
    );
  }

  // Получаем статистику пользователя
  const { rows: statsRows } = await db.query(
    `SELECT * FROM user_stats WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  const stats = statsRows[0] || null;

  return NextResponse.json({
    ok: true,
    profile: {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      telegramUsername: user.telegram_username,
      createdAt: user.created_at,
      stats: stats
        ? {
            totalPoints: stats.total_points,
            testsCompleted: stats.tests_completed,
          }
        : null,
    },
  });
}
