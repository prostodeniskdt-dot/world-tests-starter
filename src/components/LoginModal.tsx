"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = dialog?.querySelectorAll<HTMLElement>(focusableSelector);
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleClose, isOpen]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={handleClose}
    >
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex min-h-11 min-w-11 items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        
        <h2 id="auth-dialog-title" className="text-2xl sm:text-3xl font-bold mb-2 text-center text-gradient pr-8">
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
