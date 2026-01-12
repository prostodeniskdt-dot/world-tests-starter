import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { checkRateLimit, registerRateLimiter } from "@/lib/rateLimit";

const registerSchema = z.object({
  email: z.string().email("Невалидный email адрес"),
  firstName: z.string().trim().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
  lastName: z.string().trim().min(1, "Фамилия обязательна").max(50, "Фамилия слишком длинная"),
  telegramUsername: z.string().trim().optional(),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
});

export async function POST(req: Request) {
  // Получаем IP адрес
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";

  // Проверяем rate limit
  const rateLimit = await checkRateLimit(registerRateLimiter, ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Слишком много попыток регистрации. Попробуйте через ${Math.ceil(
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { 
        ok: false, 
        error: parsed.error.issues.map((i) => i.message).join(", ") 
      },
      { status: 400 }
    );
  }

  const { email, firstName, lastName, telegramUsername, password } = parsed.data;

  // Проверка силы пароля
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return NextResponse.json(
      { ok: false, error: passwordValidation.error },
      { status: 400 }
    );
  }

  // Хешируем пароль
  const passwordHash = await hashPassword(password);

  // Нормализуем telegram username - убираем @ если есть
  const normalizedTelegramUsername = telegramUsername
    ? telegramUsername.replace(/^@/, "").trim() || null
    : null;

  const userId = crypto.randomUUID();

  // Регистрируем пользователя в БД через RPC функцию
  // Функция register_user имеет security definer и обходит RLS
  const { data: resultUserId, error } = await supabaseAdmin.rpc(
    "register_user",
    {
      p_user_id: userId,
      p_email: email.toLowerCase().trim(),
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_telegram_username: normalizedTelegramUsername,
      p_password_hash: passwordHash,
    }
  );

  if (error) {
    // Если ошибка уникальности - email уже существует
    if (
      error.message.includes("unique") ||
      error.message.includes("duplicate") ||
      error.code === "23505"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Пользователь с таким email уже зарегистрирован",
        },
        { status: 409 }
      );
    }

    console.error("Error registering user:", error);
    
    // Более информативное сообщение для ошибок схемы
    let errorMessage = error.message;
    if (error.message.includes("schema cache") || error.message.includes("not found")) {
      errorMessage = "Ошибка базы данных: функция или таблица не найдены. Убедитесь, что выполнили supabase/schema.sql в SQL Editor Supabase.";
    }
    
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка базы данных: " + errorMessage,
      },
      { status: 500 }
    );
  }

  const finalUserId = resultUserId || userId;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();

  const userData = {
    userId: finalUserId,
    email: normalizedEmail,
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    telegramUsername: normalizedTelegramUsername,
  };

  // Создаем JWT токен
  const token = signToken({
    userId: finalUserId,
    email: normalizedEmail,
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    telegramUsername: normalizedTelegramUsername,
  });

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
