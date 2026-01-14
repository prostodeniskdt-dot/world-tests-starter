import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  // Проверяем авторизацию
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse || !authResult.ok) {
    return authResult;
  }

  const { userId } = authResult;

  // Получаем профиль пользователя (только свой профиль)
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Пользователь не найден" },
      { status: 404 }
    );
  }

  // Получаем статистику пользователя
  const { data: stats, error: statsError } = await supabaseAdmin
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

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
