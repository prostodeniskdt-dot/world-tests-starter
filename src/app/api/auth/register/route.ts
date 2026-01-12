import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const registerSchema = z.object({
  email: z.string().email("Невалидный email адрес"),
  firstName: z.string().trim().min(1, "Имя обязательно").max(50, "Имя слишком длинное"),
  lastName: z.string().trim().min(1, "Фамилия обязательна").max(50, "Фамилия слишком длинная"),
  telegramUsername: z.string().trim().optional(),
});

export async function POST(req: Request) {
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

  const { email, firstName, lastName, telegramUsername } = parsed.data;

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

  return NextResponse.json({
    ok: true,
    user: {
      userId: finalUserId,
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      telegramUsername: normalizedTelegramUsername,
    },
  });
}
