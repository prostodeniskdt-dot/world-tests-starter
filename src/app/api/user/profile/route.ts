import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";

const MAX_BIO_LEN = 4000;

function toPlainText(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} }).slice(0, MAX_BIO_LEN);
}

export async function PATCH(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse || !authResult.ok) {
    return authResult;
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }

  const about = toPlainText(body.profile_about ?? body.profileAbout ?? "");
  const achievements = toPlainText(body.profile_achievements ?? body.profileAchievements ?? "");

  try {
    await db.query(
      `UPDATE users SET profile_about = $1, profile_achievements = $2, updated_at = now() WHERE id = $3`,
      [about, achievements, authResult.userId]
    );
  } catch (err) {
    console.error("PATCH profile bio error:", err);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile_about: about, profile_achievements: achievements });
}

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
      profile_about: user.profile_about ?? null,
      profile_achievements: user.profile_achievements ?? null,
      stats: stats
        ? {
            totalPoints: stats.total_points,
            testsCompleted: stats.tests_completed,
          }
        : null,
    },
  });
}
