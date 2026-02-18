import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse || !authResult.ok) {
    return authResult;
  }

  const { userId } = authResult;

  try {
    await db.query(
      `UPDATE users SET delete_requested_at = now(), updated_at = now() WHERE id = $1`,
      [userId]
    );
    return NextResponse.json({
      ok: true,
      message: "Запрос на удаление аккаунта принят. Данные будут удалены в течение 14 рабочих дней.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: "Ошибка при запросе удаления" },
      { status: 500 }
    );
  }
}
