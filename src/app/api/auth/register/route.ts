import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { checkRateLimit, registerRateLimiter } from "@/lib/rateLimit";
import { DOCUMENT_VERSION } from "@/lib/consent";

const registerSchema = z.object({
  email: z.string().email("Невалидный email адрес"),
  firstName: z.string().trim().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
  lastName: z.string().trim().min(1, "Фамилия обязательна").max(50, "Фамилия слишком длинная"),
  telegramUsername: z.string().trim().optional(),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
  consentPdp: z.literal(true, { errorMap: () => ({ message: "Необходимо согласие на обработку ПДн" }) }),
  consentPublicRating: z.boolean().optional().default(false),
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

  const { email, firstName, lastName, telegramUsername, password, consentPublicRating } = parsed.data;
  const userAgent = req.headers.get("user-agent") ?? null;

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

  // Регистрируем пользователя в БД через SQL функцию
  let resultUserId: string | null = null;
  try {
    const { rows } = await db.query(
      `SELECT register_user($1, $2, $3, $4, $5, $6) AS user_id`,
      [
        userId,
        email.toLowerCase().trim(),
        firstName.trim(),
        lastName.trim(),
        normalizedTelegramUsername,
        passwordHash,
      ]
    );
    resultUserId = rows[0]?.user_id || null;
  } catch (err: any) {
    // Если ошибка уникальности - email уже существует
    if (
      err.message?.includes("unique") ||
      err.message?.includes("duplicate") ||
      err.code === "23505"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Пользователь с таким email уже зарегистрирован",
        },
        { status: 409 }
      );
    }

    console.error("Error registering user:", err);
    
    // Более информативное сообщение для ошибок схемы
    let errorMessage = err.message || String(err);
    if (err.message?.includes("schema cache") || err.message?.includes("not found")) {
      errorMessage = "Ошибка базы данных: функция или таблица не найдены. Убедитесь, что выполнили init.sql в PostgreSQL.";
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

  // Обновляем согласие на публичный рейтинг
  try {
    await db.query(
      `UPDATE users SET consent_public_rating = $1, updated_at = now() WHERE id = $2`,
      [consentPublicRating, finalUserId]
    );
  } catch {
    // игнорируем, колонка может отсутствовать до миграции
  }

  // Логируем согласия (дата/время, IP, версия документа)
  try {
    await db.query(
      `INSERT INTO consent_logs (user_id, consent_type, ip, user_agent, document_version) VALUES ($1, 'pdp', $2, $3, $4)`,
      [finalUserId, ip, userAgent, DOCUMENT_VERSION]
    );
    if (consentPublicRating) {
      await db.query(
        `INSERT INTO consent_logs (user_id, consent_type, ip, user_agent, document_version) VALUES ($1, 'public_rating', $2, $3, $4)`,
        [finalUserId, ip, userAgent, DOCUMENT_VERSION]
      );
    }
  } catch (e) {
    console.error("Consent log error:", e);
  }

  // Получаем данные пользователя с is_admin и is_banned
  let isAdmin = false;
  let isBanned = false;
  try {
    const { rows } = await db.query(
      `SELECT is_admin, is_banned FROM users WHERE id = $1 LIMIT 1`,
      [finalUserId]
    );
    if (rows[0]) {
      isAdmin = rows[0].is_admin || false;
      isBanned = rows[0].is_banned || false;
    }
  } catch {
    // Игнорируем ошибку, используем дефолтные значения
  }

  const user = {
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
    isAdmin,
    isBanned,
  });

  // Создаем ответ
  const response = NextResponse.json({
    ok: true,
    user,
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
