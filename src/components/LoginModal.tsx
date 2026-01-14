"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocalUser } from "./UserGate";
import { RegisterForm } from "./RegisterForm";
import { LoginForm } from "./LoginForm";
import { X } from "lucide-react";

type AuthMode = "login" | "register";

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: AuthMode;
}

export function LoginModal({ 
  isOpen: externalIsOpen, 
  onClose, 
  initialMode = "login" 
}: LoginModalProps = {}) {
  const { user, setUser } = useLocalUser();
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const isExternalControl = externalIsOpen !== undefined;
  const isOpen = isExternalControl ? externalIsOpen : internalIsOpen;

  useEffect(() => {
    if (user) {
      if (onClose) {
        onClose();
      } else {
        setInternalIsOpen(false);
      }
    }
  }, [user, onClose]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [onClose]);

  const handleAuthSuccess = useCallback((authUser: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    telegramUsername?: string | null;
  }) => {
    handleClose();
  }, [handleClose]);

  if (user || !isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        
        <h2 className="text-3xl font-bold mb-2 text-center text-gradient">
          Добро пожаловать!
        </h2>
        <p className="text-zinc-600 mb-6 text-center text-sm">
          {mode === "login" 
            ? "Войдите в свой аккаунт для доступа к тестам и рейтингу"
            : "Зарегистрируйтесь для участия в тестах и рейтинге"}
        </p>

        {/* Табы переключения */}
        <div className="flex gap-2 mb-6 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
              mode === "login"
                ? "text-primary-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Вход
            {mode === "login" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
              mode === "register"
                ? "text-primary-600"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Регистрация
            {mode === "register" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t"></span>
            )}
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
