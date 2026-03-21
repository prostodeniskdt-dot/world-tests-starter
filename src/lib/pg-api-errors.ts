import "server-only";

function pgCode(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err) {
    const c = (err as { code: unknown }).code;
    return typeof c === "string" ? c : String(c);
  }
  return undefined;
}

/**
 * Понятные сообщения для типичных ошибок pg / сети при работе с API.
 * Возвращает null — показать общее сообщение и полагаться на лог.
 */
export function userMessageFromDbError(err: unknown): { message: string; status: number } | null {
  const code = pgCode(err);

  switch (code) {
    case "42703":
      return {
        message:
          "База данных не обновлена (нет нужных колонок). Администратору: выполните на сервере npm run run-db-migrations для той же БД, что указана в DATABASE_URL.",
        status: 503,
      };
    case "42P01":
      return {
        message:
          "Таблица в базе не найдена. Выполните миграции: npm run run-db-migrations.",
        status: 503,
      };
    case "23503":
      return {
        message:
          "Несогласованные данные (категория или пользователь). Обновите страницу и выберите категорию снова.",
        status: 400,
      };
    case "23505":
      return {
        message: "Такая заявка или идентификатор уже существует. Измените заголовок или обратитесь в поддержку.",
        status: 409,
      };
    default:
      break;
  }

  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("EAI_AGAIN") ||
    msg.includes("getaddrinfo") ||
    lower.includes("connection terminated") ||
    lower.includes("server closed the connection")
  ) {
    return {
      message: "Не удалось подключиться к базе данных. Попробуйте позже.",
      status: 503,
    };
  }

  return null;
}
