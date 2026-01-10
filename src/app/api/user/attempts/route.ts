import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId обязателен" },
      { status: 400 }
    );
  }

  // Получаем все попытки пользователя
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
