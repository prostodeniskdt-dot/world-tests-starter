import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  req: Request,
  { params }: { params: { testId: string } }
) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId обязателен" },
      { status: 400 }
    );
  }

  const { testId } = params;

  // Получаем тест
  const { data: test } = await supabaseAdmin
    .from("tests")
    .select("max_attempts")
    .eq("id", testId)
    .single();

  // Получаем попытки пользователя
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("test_id", testId);

  return NextResponse.json({
    ok: true,
    used: (attempts || []).length,
    max: test?.max_attempts || null,
  });
}
