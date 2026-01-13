"use client";

import { useState, useEffect } from "react";
import { useLocalUser } from "./UserGate";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

export function AuthPage() {
  const { user, setUser } = useLocalUser();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  // Если пользователь уже авторизован, перенаправляем на главную
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleAuthSuccess = (authUser: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    telegramUsername?: string | null;
  }) => {
    setUser(authUser);
    router.push("/");
  };

  if (user) {
    return null; // Пока идет редирект
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-3 gap-8 items-center">
        {/* Левая часть - визуализация/графика (2/3 ширины) */}
        <div className="hidden md:block md:col-span-2">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <h1 className="text-5xl font-bold mb-4 text-zinc-900">
              King of the Bar
            </h1>
            <p className="text-xl text-zinc-600 mb-8">
              Проверьте свои знания, пройдите тесты и соревнуйтесь с другими участниками
            </p>
            
            {/* График статистики (декоративный) */}
            <div className="mt-12 space-y-4">
              <div className="text-sm font-medium text-zinc-700 mb-4">
                Статистика участников
              </div>
              <div className="flex items-end gap-4 h-48">
                {[62, 87, 50, 75, 68].map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t-lg transition-all hover:opacity-80"
                      style={{
                        height: `${value}%`,
                        backgroundColor: 
                          idx === 0 ? "#e4e4e7" :
                          idx === 1 ? "#71717a" :
                          idx === 2 ? "#14b8a6" :
                          idx === 3 ? "#ec4899" :
                          "#f97316",
                      }}
                    />
                    <div className="text-xs text-zinc-500 mt-2">{value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Правая часть - форма входа (1/3 ширины) */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full">
            <h2 className="text-2xl font-bold mb-2 text-zinc-900">
              {mode === "login" 
                ? "Войдите в свою учетную запись" 
                : "Создайте новую учетную запись"}
            </h2>
            <p className="text-sm text-zinc-600 mb-6">
              {mode === "login"
                ? "Введите свою почту и пароль для входа"
                : "Заполните форму для регистрации"}
            </p>

            {/* Табы переключения */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "login"
                    ? "text-zinc-900 border-b-2 border-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mode === "register"
                    ? "text-zinc-900 border-b-2 border-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* Формы */}
            {mode === "login" ? (
              <LoginForm 
                onSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setMode("register")}
              />
            ) : (
              <RegisterForm 
                onSuccess={handleAuthSuccess}
              />
            )}

            {/* Футер с политикой */}
            <div className="mt-6 text-xs text-zinc-500 text-center">
              Продолжая, вы соглашаетесь с нашей{" "}
              <a href="#" className="text-zinc-900 hover:underline">
                Политикой конфиденциальности
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
