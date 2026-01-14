import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SECRET_TESTS_MAP } from "@/lib/tests-registry";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(
  req: Request,
  { params }: { params: { testId: string } }
) {
  // Проверяем авторизацию
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse || !authResult.ok) {
    return authResult;
  }

  const { userId } = authResult;
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
