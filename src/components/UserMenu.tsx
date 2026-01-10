"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocalUser } from "./UserGate";

export function UserMenu() {
  const { user, reset } = useLocalUser();
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full hover:bg-zinc-100 p-2 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-medium">
          {user.firstName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block text-sm font-medium">{fullName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-zinc-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-zinc-200">
            <div className="font-medium text-sm">{fullName}</div>
            <div className="text-xs text-zinc-500 mt-1">{user.email}</div>
            {user.telegramUsername && (
              <a
                href={`https://t.me/${user.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 block"
              >
                @{user.telegramUsername}
              </a>
            )}
          </div>
          <Link
            href={`/profile?userId=${user.userId}`}
            className="block px-4 py-2 text-sm hover:bg-zinc-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Личный кабинет
          </Link>
          <button
            onClick={() => {
              reset();
              setIsOpen(false);
              window.location.reload();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-50 transition-colors"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
