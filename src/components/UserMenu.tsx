"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocalUser } from "./UserGate";
import { User, LogOut, Shield, FileText } from "lucide-react";

export function UserMenu() {
  const { user, reset } = useLocalUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const handleLogout = async () => {
    setIsOpen(false);
    await reset();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 items-center gap-2 sm:gap-3 rounded-full hover:bg-zinc-100 p-1 sm:p-2 transition-all"
        aria-expanded={isOpen}
        aria-controls="user-account-menu"
        aria-haspopup="menu"
        aria-label="Открыть меню пользователя"
      >
        {user.avatarUrl ? (
          // Публичный URL из S3
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={`Аватар: ${fullName}`}
            className="h-10 w-10 rounded-full object-cover shadow-md ring-2 ring-white"
          />
        ) : (
          <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-md">
            {user.firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:block max-w-32 truncate text-sm font-semibold text-zinc-900">
          {user.firstName}
        </span>
      </button>

      {isOpen && (
        <div
          id="user-account-menu"
          role="menu"
          className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] sm:w-72 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50 animate-scale-in"
        >
          <div className="px-4 py-3 border-b border-zinc-200">
            <div className="font-semibold text-sm text-zinc-900">{fullName}</div>
            <div className="text-xs text-zinc-500 mt-1">{user.email}</div>
            {user.telegramUsername && (
              <a
                href={`https://t.me/${user.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline mt-1 block"
              >
                @{user.telegramUsername}
              </a>
            )}
          </div>
          <Link
            href={`/profile?userId=${user.userId}`}
            role="menuitem"
            className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            Личный кабинет
          </Link>
          <Link
            href="/profile/materials"
            role="menuitem"
            className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Мои материалы
          </Link>
          {user.isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 transition-colors border-t border-zinc-200 mt-1"
              onClick={() => setIsOpen(false)}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              Админ-панель
            </Link>
          )}
          <button
            onClick={handleLogout}
            role="menuitem"
            className="w-full flex min-h-11 items-center gap-3 text-left px-4 py-2 text-sm text-error hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
