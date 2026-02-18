"use client";

import { useState, useEffect } from "react";
import { validateEmail } from "@/lib/emailValidator";
import { validatePasswordStrength } from "@/lib/password";
import { useLocalUser } from "./UserGate";
import { addToast } from "./Toast";
import { buttonStyles } from "@/lib/button-styles";
import { Spinner } from "./Spinner";
import { DocModal } from "./DocModal";

type RegisterFormProps = {
  onSuccess: (user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    telegramUsername?: string | null;
    isAdmin?: boolean;
    isBanned?: boolean;
  }) => void;
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { setUser } = useLocalUser();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [consentPdp, setConsentPdp] = useState(false);
  const [consentPublicRating, setConsentPublicRating] = useState(false);
  const [showPdnModal, setShowPdnModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Валидация email перед отправкой
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Неверный email");
      setLoading(false);
      return;
    }

    // Проверка на существующий email
    if (emailError && emailError.includes("уже зарегистрирован")) {
      setError(emailError);
      setLoading(false);
      return;
    }

    // Валидация пароля
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || "Неверный пароль");
      setLoading(false);
      return;
    }

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    if (!consentPdp) {
      setError("Необходимо дать согласие на обработку персональных данных");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          telegramUsername: telegramUsername.trim() || undefined,
          password: password,
          consentPdp: true,
          consentPublicRating,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || "Ошибка регистрации");
        return;
      }

      if (result.user) {
        setUser(result.user);
        onSuccess(result.user);
        addToast("Регистрация успешна!", "success");
      } else {
        setError("Ошибка регистрации");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Ошибка при регистрации. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  // Проверка существующего email при вводе (debounce)
  useEffect(() => {
    const checkEmail = async () => {
      if (!email || !email.includes("@")) {
        setEmailError(null);
        return;
      }

      // Сначала проверяем валидацию формата и временных email
      const validation = validateEmail(email);
      if (!validation.valid) {
        setEmailError(validation.error || null);
        return;
      }

      // Если валидация прошла, проверяем существование пользователя
      try {
        const response = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const result = await response.json();
        
        if (result.ok && result.exists) {
          setEmailError("Пользователь с таким email уже зарегистрирован. Войдите в систему.");
        } else {
          setEmailError(null);
        }
      } catch {
        // Игнорируем ошибки проверки, чтобы не мешать пользователю
        setEmailError(null);
      }
    };

    const timeoutId = setTimeout(checkEmail, 800);
    return () => clearTimeout(timeoutId);
  }, [email]);

  // Нормализуем telegram username - убираем @ если пользователь вводит
  const handleTelegramChange = (value: string) => {
    const normalized = value.replace(/^@/, "");
    setTelegramUsername(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="example@email.com"
          className={`w-full rounded-md border px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] sm:min-h-0 ${
            emailError ? "border-red-300" : ""
          }`}
        />
        {emailError && (
          <p className="mt-1 text-xs text-red-600">{emailError}</p>
        )}
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
          Имя <span className="text-red-500">*</span>
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          minLength={1}
          maxLength={50}
          placeholder="Ваше имя"
          className="w-full rounded-md border px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] sm:min-h-0"
        />
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
          Фамилия <span className="text-red-500">*</span>
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          minLength={1}
          maxLength={50}
          placeholder="Ваша фамилия"
          className="w-full rounded-md border px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] sm:min-h-0"
        />
      </div>

      <div>
        <label htmlFor="telegramUsername" className="block text-sm font-medium mb-1">
          Ник в Telegram
        </label>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">@</span>
          <input
            id="telegramUsername"
            type="text"
            value={telegramUsername}
            onChange={(e) => handleTelegramChange(e.target.value)}
            maxLength={32}
            placeholder="username"
            className="flex-1 rounded-md border px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] sm:min-h-0"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Укажите ваш ник в Telegram для связи (без @)
        </p>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consentPdp}
            onChange={(e) => setConsentPdp(e.target.checked)}
            className="mt-1 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm">
            Даю согласие на обработку персональных данных и принимаю{" "}
            <button
              type="button"
              onClick={() => setShowPdnModal(true)}
              className="text-primary-600 hover:underline"
            >
              Политику ПДн
            </button>
            . <span className="text-red-500">*</span>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consentPublicRating}
            onChange={(e) => setConsentPublicRating(e.target.checked)}
            className="mt-1 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm">
            Разрешаю публиковать выбранные мной данные в публичном рейтинге.
          </span>
        </label>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Пароль <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Минимум 8 символов"
            className="w-full rounded-md border px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] sm:min-h-0"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-zinc-900 p-2 -mr-2"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPassword ? "Скрыть" : "Показать"}
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Минимум 8 символов, заглавная и строчная буква, цифра
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Подтвердите пароль <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Повторите пароль"
            className="w-full rounded-md border px-3 py-2.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 min-h-[44px] sm:min-h-0"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-zinc-900 p-2 -mr-2"
            aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            {showConfirmPassword ? "Скрыть" : "Показать"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-950 border border-red-800 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full ${buttonStyles.primary}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span>Регистрация...</span>
          </span>
        ) : (
          "Зарегистрироваться"
        )}
      </button>

      <DocModal slug="pdn" isOpen={showPdnModal} onClose={() => setShowPdnModal(false)} />
    </form>
  );
}
