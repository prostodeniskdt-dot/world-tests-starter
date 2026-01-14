import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, JWTPayload } from "@/lib/jwt";

/**
 * Middleware для проверки авторизации пользователя
 * Используйте в API routes, которые требуют авторизации
 * 
 * @returns {Promise<{ok: true, userId: string, payload: JWTPayload} | NextResponse>}
 * Возвращает userId и payload при успешной авторизации, или NextResponse с ошибкой
 */
export async function requireAuth(
  req: Request
): Promise<{ ok: true; userId: string; payload: JWTPayload } | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Требуется авторизация" },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Невалидный токен" },
      { status: 401 }
    );
  }

  // Проверяем, не забанен ли пользователь
  if (payload.isBanned) {
    return NextResponse.json(
      { ok: false, error: "Ваш аккаунт заблокирован" },
      { status: 403 }
    );
  }

  return { ok: true, userId: payload.userId, payload };
}
