"use client";

import { useEffect, useMemo, useState } from "react";
import type { JWTPayload } from "@/lib/jwt";

export type LocalUser = JWTPayload & {
  userId: string;
};

export function useLocalUser() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем токен при монтировании
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify");
        const result = await response.json();
        
        if (result.ok && result.authenticated && result.user) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const api = useMemo(() => {
    return {
      user,
      isLoading,
      setUser: (newUser: LocalUser) => {
        // Токен уже установлен через cookie, просто обновляем состояние
        setUser(newUser);
      },
      reset: async () => {
        // Удаляем токен через API
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // Игнорируем ошибки при выходе
        }
        setUser(null);
      },
    };
  }, [user, isLoading]);

  return api;
}

export function UserGate(props: {
  title?: string;
  children: (user: LocalUser) => React.ReactNode;
}) {
  const { user } = useLocalUser();

  if (!user) {
    return (
      <div className="rounded-md border bg-white p-4">
        <div className="font-medium mb-2">{props.title ?? "Требуется регистрация"}</div>
        <p className="text-sm text-zinc-600 mb-4">
          Для участия в тестах и рейтинге необходимо зарегистрироваться.
        </p>
      </div>
    );
  }

  return <>{props.children(user)}</>;
}
