import { NextResponse } from "next/server";
import { z } from "zod";
import { validatePasswordResetToken, markTokenAsUsed } from "@/lib/passwordReset";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { db } from "@/lib/db";
import { checkRateLimit, resetPasswordRateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/request";

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(resetPasswordRateLimiter, ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { token, password } = schema.parse(body);

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { ok: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    const userId = await validatePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Недействительный или истекший токен" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    await db.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, userId]
    );

    await markTokenAsUsed(token);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ошибка при сбросе пароля" },
      { status: 500 }
    );
  }
}
