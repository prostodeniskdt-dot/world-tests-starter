"use client";

import { useState } from "react";
import { validateEmail } from "@/lib/emailValidator";
import { useLocalUser } from "./UserGate";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { addToast } from "./Toast";
import { buttonStyles } from "@/lib/button-styles";
import { Spinner } from "./Spinner";

type LoginFormProps = {
  onSuccess: (user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    telegramUsername?: string | null;
    isAdmin?: boolean;
    isBanned?: boolean;
  }) => void;
  onSwitchToRegister: () => void;
};

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { setUser } = useLocalUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Валидация email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Неверный email");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Введите пароль");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || "Ошибка входа");
        return;
      }

      if (result.user) {
        setUser(result.user);
        onSuccess(result.user);
        addToast("Успешный вход!", "success");
      } else {
        setError("Ошибка входа");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Ошибка при входе. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium mb-1 text-zinc-200">
          Электронная почта <span className="text-red-500">*</span>
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="example@email.com"
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="login-password" className="block text-sm font-medium text-zinc-200">
            Пароль <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            {showPassword ? "Скрыть" : "Показать"}
          </button>
        </div>
        <input
          id="login-password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Введите пароль"
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        />
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            Забыли пароль?
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
            <span>Вход...</span>
          </span>
        ) : (
          "Войти"
        )}
      </button>

      <div className="text-center text-sm text-zinc-400">
        У вас нет аккаунта?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-zinc-100 font-medium hover:underline"
        >
          Создать
        </button>
      </div>

      {/* Модальное окно восстановления пароля */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setError(null);
        }}
      />
    </form>
  );
}
