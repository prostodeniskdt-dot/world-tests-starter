import "server-only";
import crypto from "crypto";

/**
 * Верифицирует данные от Telegram Login Widget
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(
  authData: {
    id: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: string;
    hash: string;
  },
  botToken: string
): boolean {
  const { hash, ...data } = authData;

  // Создаём data-check-string из всех полей кроме hash, отсортированных по ключу
  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => {
      const value = data[key as keyof typeof data];
      return `${key}=${value}`;
    })
    .join("\n");

  // Вычисляем секретный ключ: SHA256(bot_token)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  // Вычисляем HMAC-SHA256(data_check_string, secret_key)
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // Проверяем, что хеш совпадает
  if (calculatedHash !== hash) {
    return false;
  }

  // Проверяем, что данные не старше 24 часов
  const authDate = parseInt(authData.auth_date, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = currentTime - authDate;

  if (timeDiff > 86400) {
    // 24 часа
    return false;
  }

  return true;
}
