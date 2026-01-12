"use client";

import { useEffect, useMemo, useState } from "react";

export type LocalUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  telegramUsername?: string | null;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загружаем пользователя при монтировании
    const loadedUser = getLocalUser();
    setUser(loadedUser);
    setIsLoading(false);
  }, []);

  // Слушаем изменения localStorage из других вкладок
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = () => {
      const loadedUser = getLocalUser();
      setUser(loadedUser);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const api = useMemo(() => {
    return {
      user,
      isLoading,
      setUser: (newUser: LocalUser) => {
        setLocalUser(newUser);
        setUser(newUser);
        // Принудительно обновляем состояние через событие storage
        if (typeof window !== "undefined") {
          // Используем custom event для синхронизации в той же вкладке
          window.dispatchEvent(new Event("storage"));
        }
      },
      reset: () => {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(LS_USER_ID);
        window.localStorage.removeItem(LS_USER_DATA);
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
