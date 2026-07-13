import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/passwordReset";
import {
  checkRateLimit,
  forgotPasswordByEmailRateLimiter,
  forgotPasswordRateLimiter,
} from "@/lib/rateLimit";
import { getClientIp } from "@/lib/request";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipLimit = await checkRateLimit(forgotPasswordRateLimiter, ip);
  if (!ipLimit.allowed) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const emailLimit = await checkRateLimit(
      forgotPasswordByEmailRateLimiter,
      normalizedEmail
    );
    if (!emailLimit.allowed) {
      return NextResponse.json({ ok: true });
    }

    const { rows } = await db.query(
      `SELECT id, email, first_name FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    await createPasswordResetToken(user.id);

    // Email delivery: set RESET_EMAIL_ENABLED=true and integrate SendGrid/Resend.
    if (process.env.RESET_EMAIL_ENABLED === "true") {
      // TODO: send email with reset link
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
