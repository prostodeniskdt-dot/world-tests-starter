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

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();

  // Проверяем, существует ли пользователь с таким email
  const { data: existingUser, error: checkError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 - это "not found", что нормально для нового пользователя
    console.error("Error checking existing user:", checkError);
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка базы данных: " + checkError.message,
      },
      { status: 500 }
    );
  }

  let userId: string;

  if (existingUser) {
    // Обновляем существующего пользователя
    userId = existingUser.id;
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        telegram_username: normalizedTelegramUsername,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        {
          ok: false,
          error: "Ошибка базы данных: " + updateError.message,
        },
        { status: 500 }
      );
    }
  } else {
    // Создаём нового пользователя
    userId = crypto.randomUUID();
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email: normalizedEmail,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        telegram_username: normalizedTelegramUsername,
      });

    if (insertError) {
      // Если ошибка уникальности - email уже существует (race condition)
      if (
        insertError.code === "23505" ||
        insertError.message.includes("unique") ||
        insertError.message.includes("duplicate")
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Пользователь с таким email уже зарегистрирован",
          },
          { status: 409 }
        );
      }

      console.error("Error inserting user:", insertError);
      return NextResponse.json(
        {
          ok: false,
          error: "Ошибка базы данных: " + insertError.message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    user: {
      userId: userId,
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      telegramUsername: normalizedTelegramUsername,
    },
  });
}
