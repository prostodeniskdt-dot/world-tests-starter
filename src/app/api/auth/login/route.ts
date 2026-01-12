import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const loginSchema = z.object({
  email: z.string().email("Невалидный email адрес"),
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

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Ищем пользователя по email
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, last_name, telegram_username")
    .eq("email", normalizedEmail)
    .single();

  // Обработка ошибок
  if (error) {
    // PGRST116 - это код ошибки "not found" в Supabase
    if (error.code === "PGRST116") {
      return NextResponse.json(
        {
          ok: false,
          error: "Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь.",
        },
        { status: 404 }
      );
    }

    // Другие ошибки БД
    console.error("Error finding user:", error);
    const errorMessage = error.message || String(error);
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка базы данных: " + errorMessage,
      },
      { status: 500 }
    );
  }

  // Если пользователь не найден (нет ошибки, но и нет данных)
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      telegramUsername: user.telegram_username,
    },
  });
}
