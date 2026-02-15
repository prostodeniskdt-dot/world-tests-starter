import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-middleware";

export async function GET(req: Request) {
  // Проверяем админские права
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;
  const search = searchParams.get("search") || "";
  const bannedOnly = searchParams.get("bannedOnly") === "true";

  try {
    // Строим запрос динамически
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(email ILIKE $${paramIdx} OR first_name ILIKE $${paramIdx} OR last_name ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (bannedOnly) {
      conditions.push(`is_banned = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Получаем пользователей с пагинацией и count
    const [usersResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, email, first_name, last_name, telegram_username, is_admin, is_banned, banned_until, created_at
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) AS count FROM users ${whereClause}`,
        params
      ),
    ]);

    const users = usersResult.rows;
    const count = parseInt(countResult.rows[0]?.count || "0", 10);

    // Получаем статистику для каждого пользователя
    const userIds = users.map((u: any) => u.id);
    let statsMap = new Map<string, { totalPoints: number; testsCompleted: number }>();

    if (userIds.length > 0) {
      const { rows: stats } = await db.query(
        `SELECT user_id, total_points, tests_completed FROM user_stats WHERE user_id = ANY($1)`,
        [userIds]
      );
      statsMap = new Map(
        stats.map((s: any) => [
          s.user_id,
          {
            totalPoints: s.total_points,
            testsCompleted: s.tests_completed,
          },
        ])
      );
    }

    // Формируем ответ
    const usersWithStats = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      telegramUsername: user.telegram_username,
      isAdmin: user.is_admin,
      isBanned: user.is_banned,
      bannedUntil: user.banned_until,
      createdAt: user.created_at,
      stats: statsMap.get(user.id) || {
        totalPoints: 0,
        testsCompleted: 0,
      },
    }));

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      ok: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
