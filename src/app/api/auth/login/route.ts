import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { checkRateLimit, loginRateLimiter } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().email("Невалидный email адрес"),
  password: z.string().min(1, "Пароль обязателен"),
});

export async function POST(req: Request) {
  // Получаем IP адрес
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";

  // Проверяем rate limit
  const rateLimit = await checkRateLimit(loginRateLimiter, ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Слишком много попыток входа. Попробуйте через ${Math.ceil(
          (rateLimit.resetTime?.getTime() || Date.now() - Date.now()) / 1000
        )} секунд.`,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { 
        ok: false, 
        error: parsed.error.issues.map((i) => i.message).join(", ") 
      },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Получаем пользователя с паролем
  let user: any;
  try {
    const { rows } = await db.query(
      `SELECT id, email, first_name, last_name, telegram_username, password_hash, is_admin, is_banned
       FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );
    user = rows[0] || null;
  } catch (err: any) {
    console.error("Error finding user:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка базы данных: " + (err.message || String(err)),
      },
      { status: 500 }
    );
  }

  // Если пользователь не найден
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Неверный email или пароль",
      },
      { status: 401 }
    );
  }

  // Проверяем наличие пароля
  if (!user.password_hash) {
    return NextResponse.json(
      {
        ok: false,
        error: "У этого аккаунта нет пароля. Пожалуйста, зарегистрируйтесь заново.",
      },
      { status: 401 }
    );
  }

  // Проверяем пароль
  const isPasswordValid = await verifyPassword(password, user.password_hash);
  
  if (!isPasswordValid) {
    return NextResponse.json(
      {
        ok: false,
        error: "Неверный email или пароль",
      },
      { status: 401 }
    );
  }

  // Проверяем, не забанен ли пользователь
  if (user.is_banned) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ваш аккаунт заблокирован. Обратитесь к администратору.",
      },
      { status: 403 }
    );
  }

  // Создаем JWT токен
  const token = signToken({
    userId: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    telegramUsername: user.telegram_username,
    isAdmin: user.is_admin || false,
    isBanned: user.is_banned || false,
  });

  const userData = {
    userId: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    telegramUsername: user.telegram_username,
    isAdmin: user.is_admin || false,
    isBanned: user.is_banned || false,
  };

  // Создаем ответ
  const response = NextResponse.json({
    ok: true,
    user: userData,
  });

  // Устанавливаем httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    path: "/",
  });

  // Также устанавливаем через response для совместимости
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
