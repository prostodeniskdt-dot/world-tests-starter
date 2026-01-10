import { NextResponse } from "next/server";
import crypto from "crypto";
import { telegramAuthSchema } from "@/lib/validators";
import { verifyTelegramAuth } from "@/lib/telegramAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var ${name}`);
  }
  return v;
}

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

  const parsed = telegramAuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const authData = parsed.data;

  // Верифицируем данные через токен бота
  const botToken = required("TELEGRAM_BOT_TOKEN");
  if (!verifyTelegramAuth(authData, botToken)) {
    return NextResponse.json(
      { ok: false, error: "Невалидная авторизация Telegram" },
      { status: 401 }
    );
  }

  const telegramId = BigInt(authData.id);
  const username =
    authData.username ||
    `${authData.first_name || ""} ${authData.last_name || ""}`.trim() ||
    `user_${authData.id}`;

  // Проверяем, существует ли пользователь с таким telegram_id
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("telegram_id", Number(telegramId))
    .single();

  const userId = existingUser?.id || crypto.randomUUID();

  // Сохраняем или обновляем пользователя в БД
  const { data: resultUserId, error } = await supabaseAdmin.rpc(
    "upsert_telegram_user",
    {
      p_user_id: userId,
      p_telegram_id: Number(telegramId),
      p_username: username.substring(0, 24),
      p_first_name: authData.first_name || null,
      p_last_name: authData.last_name || null,
      p_telegram_username: authData.username || null,
      p_avatar_url: authData.photo_url || null,
    }
  );

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка базы данных: " + error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      userId: resultUserId || userId,
      telegramId: authData.id,
      username,
      firstName: authData.first_name,
      lastName: authData.last_name,
      telegramUsername: authData.username,
      avatarUrl: authData.photo_url,
    },
  });
}
