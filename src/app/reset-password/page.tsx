"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { validatePasswordStrength } from "@/lib/password";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Отсутствует токен сброса пароля");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Отсутствует токен");
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || "Неверный пароль");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(result.error || "Ошибка при сбросе пароля");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError("Ошибка при сбросе пароля");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Недействительная ссылка</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-600 text-xl mb-4">Пароль успешно изменен!</div>
          <div className="text-zinc-600">Перенаправление на главную страницу...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Сброс пароля</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Новый пароль <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Подтвердите пароль <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-2 rounded-md disabled:opacity-50"
          >
            {loading ? "Сброс..." : "Сбросить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}
