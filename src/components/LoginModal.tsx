"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocalUser } from "./UserGate";
import { RegisterForm } from "./RegisterForm";
import { LoginForm } from "./LoginForm";

type AuthMode = "login" | "register";

export function LoginModal() {
  const { user, setUser } = useLocalUser();
  const [showModal, setShowModal] = useState(true);
  const [mode, setMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (user) {
      setShowModal(false);
    }
  }, [user]);

  const handleAuthSuccess = useCallback((authUser: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    telegramUsername?: string | null;
  }) => {
    setUser(authUser);
    setShowModal(false);
  }, [setUser]);

  if (user || !showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Добро пожаловать в World Tests!
        </h2>
        <p className="text-zinc-600 mb-6 text-center text-sm">
          {mode === "login" 
            ? "Войдите в свой аккаунт для доступа к тестам и рейтингу"
            : "Зарегистрируйтесь для участия в тестах и рейтинге"}
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
          <RegisterForm onSuccess={handleAuthSuccess} />
        )}
      </div>
    </div>
  );
}
