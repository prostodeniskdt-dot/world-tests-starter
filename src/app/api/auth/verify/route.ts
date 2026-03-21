import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  }

  let avatarUrl: string | null = null;
  let profileCoverUrl: string | null = null;
  try {
    const { rows } = await db.query(
      `SELECT avatar_url, profile_cover_url FROM users WHERE id = $1 LIMIT 1`,
      [payload.userId]
    );
    avatarUrl = rows[0]?.avatar_url ?? null;
    profileCoverUrl = rows[0]?.profile_cover_url ?? null;
  } catch {
    // колонки могут отсутствовать до миграции
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      ...payload,
      userId: payload.userId,
      avatarUrl,
      profileCoverUrl,
    },
  });
}
