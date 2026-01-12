// Список известных временных email сервисов
const TEMPORARY_EMAIL_DOMAINS = [
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'getnada.com',
  'mohmal.com',
  'fakeinbox.com',
  'trashmail.com',
  'maildrop.cc',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'dispostable.com',
  'mailnesia.com',
  'mintemail.com',
  'mytrashmail.com',
  'spamgourmet.com',
  'tempmailo.com',
  'tmpmail.org',
  'throwawaymail.com',
  'emailondeck.com',
  'mailcatch.com',
  'inboxkitten.com',
];

/**
 * Проверяет, является ли email адрес временным
 * @param email - Email адрес для проверки
 * @returns true если email является временным
 */
export function isTemporaryEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return TEMPORARY_EMAIL_DOMAINS.some(
    tempDomain => domain === tempDomain || domain.endsWith(`.${tempDomain}`)
  );
}

/**
 * Валидирует email адрес
 * @param email - Email адрес для валидации
 * @returns Объект с результатом валидации и сообщением об ошибке (если есть)
 */
export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = email.trim().toLowerCase();
  
  // Базовая проверка формата
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Неверный формат email адреса' };
  }
  
  // Проверка на временные email
  if (isTemporaryEmail(trimmed)) {
    return { 
      valid: false, 
      error: 'Использование временных email адресов запрещено. Пожалуйста, используйте постоянный email.' 
    };
  }
  
  return { valid: true };
}
