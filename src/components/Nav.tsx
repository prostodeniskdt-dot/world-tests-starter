"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { LoginModal } from "./LoginModal";
import { useLocalUser } from "./UserGate";
import { Trophy } from "lucide-react";

export function Nav() {
  const { user } = useLocalUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

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
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-xl text-gradient hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            <Trophy className="h-6 w-6 text-primary-600 flex-shrink-0" aria-label="Трофей" />
            <span className="whitespace-nowrap">King of the Bar</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setShowAuthModal(true);
                  }}
                  className="rounded-lg border border-zinc-300 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 transition-all whitespace-nowrap"
                >
                  Войти
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setShowAuthModal(true);
                  }}
                  className="rounded-lg gradient-primary px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Зарегистрироваться</span>
                  <span className="sm:hidden">Регистрация</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
