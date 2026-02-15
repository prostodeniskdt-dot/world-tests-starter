import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSecretTest } from "@/lib/tests-registry";
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

  // Получаем тест из БД
  const testSecret = await getSecretTest(testId);
  if (!testSecret) {
    return NextResponse.json(
      { ok: false, error: "Тест не найден" },
      { status: 404 }
    );
  }

  // Получаем попытки пользователя из БД
  const { rows: attempts } = await db.query(
    `SELECT id FROM attempts WHERE user_id = $1 AND test_id = $2`,
    [userId, testId]
  );

  return NextResponse.json({
    ok: true,
    used: attempts.length,
    max: testSecret.maxAttempts ?? null,
  });
}
