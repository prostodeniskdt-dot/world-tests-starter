"use client";

import { useState } from "react";
import { validateEmail } from "@/lib/emailValidator";
import { useLocalUser } from "./UserGate";

type LoginFormProps = {
  onSuccess: (user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    telegramUsername?: string | null;
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
        <label htmlFor="login-email" className="block text-sm font-medium mb-1">
          Электронная почта <span className="text-red-500">*</span>
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="example@email.com"
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="login-password" className="block text-sm font-medium">
            Пароль <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-zinc-600 hover:text-zinc-900"
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
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <div className="flex justify-end mt-1">
          <button
            type="button"
            className="text-xs text-zinc-600 hover:text-zinc-900"
          >
            Забыли пароль?
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Вход..." : "Войти"}
      </button>

      <div className="text-center text-sm text-zinc-600">
        У вас нет аккаунта?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-zinc-900 font-medium hover:underline"
        >
          Создать
        </button>
      </div>
    </form>
  );
}
