import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(req: Request) {
  // Проверяем авторизацию
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse || !authResult.ok) {
    return authResult;
  }

  const { userId } = authResult;

  // Получаем все попытки пользователя (только свои попытки)
  try {
    const { rows: attempts } = await db.query(
      `SELECT * FROM attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );

    return NextResponse.json({
      ok: true,
      attempts: attempts || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Ошибка базы данных: " + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
