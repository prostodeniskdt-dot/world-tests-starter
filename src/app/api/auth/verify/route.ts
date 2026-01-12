import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

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

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: payload,
  });
}
