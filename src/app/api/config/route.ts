import { NextResponse } from "next/server";

export async function GET() {
  // Имя бота для Telegram Login Widget
  // Получаем из переменной окружения или используем дефолтное значение
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || "world_tests_bot";

  return NextResponse.json({
    ok: true,
    telegramBotName: botName,
  });
}
