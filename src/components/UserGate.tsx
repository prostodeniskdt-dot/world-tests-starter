"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

export type LocalUser = {
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  telegramUsername?: string;
  telegramId?: string;
  avatarUrl?: string;
};

const LS_USER_ID = "wt_user_id";
const LS_USER_DATA = "wt_user_data";

function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const userData = window.localStorage.getItem(LS_USER_DATA);
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

function setLocalUser(user: LocalUser) {
  window.localStorage.setItem(LS_USER_ID, user.userId);
  window.localStorage.setItem(LS_USER_DATA, JSON.stringify(user));
}

export function useLocalUser() {
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    setUser(getLocalUser());
  }, []);

  const handleTelegramAuth = useCallback(async (telegramData: any) => {
    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramData),
      });

      const result = await response.json();

      if (result.ok && result.user) {
        const newUser: LocalUser = {
          userId: result.user.userId,
          username: result.user.username,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          telegramUsername: result.user.telegramUsername,
          telegramId: result.user.telegramId,
          avatarUrl: result.user.avatarUrl,
        };
        setLocalUser(newUser);
        setUser(newUser);
      } else {
        console.error("Ошибка авторизации:", result.error);
        alert("Ошибка авторизации: " + (result.error || "Неизвестная ошибка"));
      }
    } catch (error) {
      console.error("Ошибка при авторизации:", error);
      alert("Ошибка при авторизации. Попробуйте ещё раз.");
    }
  }, []);

  const api = useMemo(() => {
    return {
      user,
      handleTelegramAuth,
      reset: () => {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(LS_USER_ID);
        window.localStorage.removeItem(LS_USER_DATA);
        setUser(null);
      },
    };
  }, [user, handleTelegramAuth]);

  return api;
}

export function UserGate(props: {
  title?: string;
  children: (user: LocalUser) => React.ReactNode;
}) {
  const { user, handleTelegramAuth } = useLocalUser();
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState<string>("world_tests_bot");

  useEffect(() => {
    // Получаем имя бота из конфига
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.telegramBotName) {
          setBotName(data.telegramBotName);
        }
      })
      .catch(() => {
        // Используем дефолтное значение при ошибке
      });
  }, []);

  useEffect(() => {
    // Инициализируем Telegram Login Widget
    if (typeof window !== "undefined" && !user && botName) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", botName);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write");
      script.async = true;
      document.body.appendChild(script);

      // Глобальная функция для обработки авторизации
      (window as any).onTelegramAuth = (telegramUser: any) => {
        setLoading(true);
        handleTelegramAuth(telegramUser).finally(() => setLoading(false));
      };

      return () => {
        // Cleanup
        const existingScript = document.querySelector(
          'script[src*="telegram-widget.js"]'
        );
        if (existingScript) {
          existingScript.remove();
        }
        delete (window as any).onTelegramAuth;
      };
    }
  }, [user, handleTelegramAuth, botName]);

  if (!user) {
    return (
      <div className="rounded-md border bg-white p-4">
        <div className="font-medium mb-2">{props.title ?? "Войдите через Telegram"}</div>
        <p className="text-sm text-zinc-600 mb-4">
          Для участия в тестах и рейтинге необходимо войти через Telegram.
          Это позволит сохранять ваши результаты и связываться с вами.
        </p>
        {loading ? (
          <div className="text-sm text-zinc-600">Обработка авторизации...</div>
        ) : (
          <div id="telegram-login-container" className="flex justify-center">
            {/* Telegram Login Widget будет вставлен сюда скриптом */}
          </div>
        )}
      </div>
    );
  }

  return <>{props.children(user)}</>;
}
