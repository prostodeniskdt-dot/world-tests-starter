import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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

  // Строим запрос
  let query = supabaseAdmin
    .from("users")
    .select("id, email, first_name, last_name, telegram_username, is_admin, is_banned, banned_until, created_at", { count: "exact" });

  // Фильтр по поиску
  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  // Фильтр по банам
  if (bannedOnly) {
    query = query.eq("is_banned", true);
  }

  // Получаем пользователей с пагинацией
  const { data: users, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  // Получаем статистику для каждого пользователя
  const userIds = (users || []).map((u) => u.id);
  const { data: stats } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, total_points, tests_completed")
    .in("user_id", userIds);

  const statsMap = new Map(
    (stats || []).map((s) => [s.user_id, s])
  );

  // Формируем ответ
  const usersWithStats = (users || []).map((user) => ({
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
      total: count || 0,
      totalPages,
    },
  });
}
