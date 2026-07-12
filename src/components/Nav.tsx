"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { LoginModal } from "./LoginModal";
import { SectionNav } from "./SectionNav";
import { useLocalUser } from "./UserGate";
import { SITE_NAME } from "@/lib/constants";
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
      <header
        data-site-header
        className="border-b border-stone-200/80 bg-surface-raised/90 backdrop-blur-md sticky top-0 z-40 shadow-soft"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 min-w-0">
          <Link
            href="/"
            className="flex min-w-0 items-center font-display text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-stone-950 hover:text-primary-800 transition-colors"
          >
            <span className="truncate">{SITE_NAME}</span>
          </Link>
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
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
        <SectionNav />
      </header>
    </>
  );
}
