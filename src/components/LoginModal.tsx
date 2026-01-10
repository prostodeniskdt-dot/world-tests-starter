"use client";

import { useEffect, useState } from "react";
import { useLocalUser } from "./UserGate";
import { RegisterForm } from "./RegisterForm";

export function LoginModal() {
  const { user, setUser } = useLocalUser();
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (user) {
      setShowModal(false);
    }
  }, [user]);

  if (user || !showModal) {
    return null;
  }

  const handleRegisterSuccess = (registeredUser: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    telegramUsername?: string | null;
  }) => {
    setUser(registeredUser);
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Добро пожаловать в World Tests!
        </h2>
        <p className="text-zinc-600 mb-6 text-center text-sm">
          Для участия в тестах и рейтинге необходимо зарегистрироваться.
        </p>
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </div>
    </div>
  );
}
