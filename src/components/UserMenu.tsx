"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocalUser } from "./UserGate";
import { User, LogOut, Shield } from "lucide-react";

export function UserMenu() {
  const { user, reset } = useLocalUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-full hover:bg-zinc-800 p-2 transition-all"
      >
        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-md">
          {user.firstName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block text-sm font-semibold text-zinc-100">{fullName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 py-2 z-50 animate-scale-in">
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="font-semibold text-sm text-zinc-100">{fullName}</div>
            <div className="text-xs text-zinc-400 mt-1">{user.email}</div>
            {user.telegramUsername && (
              <a
                href={`https://t.me/${user.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-500 hover:underline mt-1 block"
              >
                @{user.telegramUsername}
              </a>
            )}
          </div>
          <Link
            href={`/profile?userId=${user.userId}`}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            Личный кабинет
          </Link>
          {user.isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-950 transition-colors border-t border-zinc-800 mt-1"
              onClick={() => setIsOpen(false)}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              Админ-панель
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-error hover:bg-red-950 transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
