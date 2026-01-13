"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { JWTPayload } from "@/lib/jwt";

export type LocalUser = JWTPayload & {
  userId: string;
};

type UserContextType = {
  user: LocalUser | null;
  isLoading: boolean;
  setUser: (newUser: LocalUser | null) => void;
  reset: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем токен при монтировании
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify");
        const result = await response.json();
        
        if (result.ok && result.authenticated && result.user) {
          setUserState(result.user);
        } else {
          setUserState(null);
        }
      } catch {
        setUserState(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setUser = (newUser: LocalUser | null) => {
    setUserState(newUser);
  };

  const reset = async () => {
    // Удаляем токен через API
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Игнорируем ошибки при выходе
    }
    setUserState(null);
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    setUser,
    reset,
  }), [user, isLoading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useLocalUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useLocalUser must be used within a UserProvider");
  }
  return context;
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
