import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DOCUMENT_VERSION } from "@/lib/consent";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: Request) {
  let body: { accepted?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const accepted = body.accepted === true;

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload) userId = payload.userId;
    }
  } catch {
    // ignore
  }

  if (accepted) {
    try {
      await db.query(
        `INSERT INTO consent_logs (user_id, consent_type, ip, user_agent, document_version)
         VALUES ($1, 'cookies', $2, $3, $4)`,
        [userId, ip, userAgent, DOCUMENT_VERSION]
      );
    } catch (e) {
      console.error("Consent log cookies error:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
