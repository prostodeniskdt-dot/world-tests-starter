import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  // Проверяем авторизацию
  const authResult = await requireAuth(req);
  if (!("ok" in authResult) || !authResult.ok) {
    return authResult as NextResponse;
  }

  const { userId } = authResult;

  // Получаем все попытки пользователя (только свои попытки)
  const { data: attempts, error } = await supabaseAdmin
    .from("attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Ошибка базы данных: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    attempts: attempts || [],
  });
}
