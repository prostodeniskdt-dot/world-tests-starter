import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/passwordReset";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const { rows } = await db.query(
      `SELECT id, email, first_name FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];

    // Всегда возвращаем успех (security best practice)
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = await createPasswordResetToken(user.id);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    // TODO: Отправить email с ссылкой
    // В продакшене используйте SendGrid, Resend, или другой email сервис
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true }); // Всегда успех для безопасности
  }
}
