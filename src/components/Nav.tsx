"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { LoginModal } from "./LoginModal";
import { useLocalUser } from "./UserGate";

export function Nav() {
  const { user } = useLocalUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Закрываем модальное окно, когда пользователь авторизован
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);

  return (
    <>
      {showAuthModal && (
        <LoginModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold text-lg">
            King of the Bar
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuthModal(true);
                  }}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Войти
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setShowAuthModal(true);
                  }}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
                >
                  Зарегистрироваться
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
