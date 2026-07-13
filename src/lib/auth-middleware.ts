import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, JWTPayload } from "@/lib/jwt";
import { getUserAuthState } from "@/lib/auth-user";

export type AuthResult = {
  ok: true;
  userId: string;
  payload: JWTPayload;
  isAdmin: boolean;
};

/**
 * Middleware для проверки авторизации пользователя.
 * Права is_admin / is_banned перечитываются из БД на каждый запрос.
 */
export async function requireAuth(
  req: Request
): Promise<AuthResult | NextResponse> {
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

  const state = await getUserAuthState(payload.userId);
  if (!state) {
    return NextResponse.json(
      { ok: false, error: "Пользователь не найден" },
      { status: 401 }
    );
  }

  if (state.isBanned) {
    return NextResponse.json(
      { ok: false, error: "Ваш аккаунт заблокирован" },
      { status: 403 }
    );
  }

  return {
    ok: true,
    userId: payload.userId,
    payload,
    isAdmin: state.isAdmin,
  };
}

/** Авторизация без 401: для публичных эндпоинтов с опциональной персонализацией. */
export async function getAuthContextOptional(): Promise<{
  userId: string;
  isAdmin: boolean;
  isBanned: boolean;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const state = await getUserAuthState(payload.userId);
  if (!state || state.isBanned) return null;

  return {
    userId: payload.userId,
    isAdmin: state.isAdmin,
    isBanned: state.isBanned,
  };
}
