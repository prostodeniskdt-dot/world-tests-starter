import { NextResponse } from "next/server";
import { z } from "zod";
import { validatePasswordResetToken, markTokenAsUsed } from "@/lib/passwordReset";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { db } from "@/lib/db";

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = schema.parse(body);

    // Валидация пароля
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { ok: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Проверка токена
    const userId = await validatePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Недействительный или истекший токен" },
        { status: 400 }
      );
    }

    // Обновление пароля
    const passwordHash = await hashPassword(password);
    await db.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, userId]
    );

    // Помечаем токен как использованный
    await markTokenAsUsed(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Ошибка при сбросе пароля" },
      { status: 500 }
    );
  }
}
