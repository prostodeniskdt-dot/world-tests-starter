import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

/**
 * Middleware для проверки админских прав
 * Используйте в API routes, которые требуют админских прав
 */
export async function requireAdmin(req: Request): Promise<{ ok: true; userId: string } | NextResponse> {
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

  if (!payload.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Доступ запрещен. Требуются админские права." },
      { status: 403 }
    );
  }

  return { ok: true, userId: payload.userId };
}
