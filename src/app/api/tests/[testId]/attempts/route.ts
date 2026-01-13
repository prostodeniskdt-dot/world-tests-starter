import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SECRET_TESTS_MAP } from "@/lib/tests-registry";

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

  // Получаем тест из файлов
  const testSecret = SECRET_TESTS_MAP[testId];
  if (!testSecret) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Получаем попытки пользователя из БД
  const { data: attempts } = await supabaseAdmin
    .from("attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("test_id", testId);

  return NextResponse.json({
    ok: true,
    used: (attempts || []).length,
    max: testSecret.maxAttempts ?? null,
  });
}
