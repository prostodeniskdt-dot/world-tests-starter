"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { LoginModal } from "./LoginModal";
import { useLocalUser } from "./UserGate";
import { Trophy } from "lucide-react";
import { buttonStyles } from "@/lib/button-styles";

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
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-xl text-gradient hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            <Trophy className="h-6 w-6 text-white flex-shrink-0" aria-label="Трофей" />
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
                  className={`${buttonStyles.secondary} whitespace-nowrap px-3 sm:px-4 text-xs sm:text-sm`}
                  aria-label="Войти в систему"
                >
                  Войти
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setShowAuthModal(true);
                  }}
                  className={`${buttonStyles.primary} whitespace-nowrap px-3 sm:px-5 text-xs sm:text-sm`}
                  aria-label="Зарегистрироваться"
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
