import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";

/**
 * Middleware для проверки админских прав.
 * is_admin и is_banned перечитываются из БД через requireAuth.
 */
export async function requireAdmin(
  req: Request
): Promise<{ ok: true; userId: string } | NextResponse> {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!authResult.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Доступ запрещен. Требуются админские права." },
      { status: 403 }
    );
  }

  return { ok: true, userId: authResult.userId };
}
