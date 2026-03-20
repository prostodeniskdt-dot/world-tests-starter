"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { LoginModal } from "./LoginModal";
import { useLocalUser } from "./UserGate";
import { Medal, BookOpen, ChevronDown } from "lucide-react";
import { SITE_NAME, LOGO_PATH } from "@/lib/constants";
import { buttonStyles } from "@/lib/button-styles";

export function Nav() {
  const { user } = useLocalUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showPairingsMenu, setShowPairingsMenu] = useState(false);

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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-xl text-gradient hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PATH} alt={SITE_NAME} className="h-7 sm:h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowPairingsMenu(!showPairingsMenu)}
                onBlur={() => setTimeout(() => setShowPairingsMenu(false), 150)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 transition-all"
                aria-expanded={showPairingsMenu}
                aria-haspopup="true"
                aria-label="Сочетания вкусов"
              >
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Сочетания</span>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              {showPairingsMenu && (
                <nav
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg py-1 z-50"
                  aria-label="Меню сочетаний"
                >
                  <Link
                    href="/pairings/reference"
                    className="block px-4 py-2 text-sm text-zinc-700 hover:bg-primary-50 hover:text-primary-700"
                    onClick={() => setShowPairingsMenu(false)}
                  >
                    Справочник
                  </Link>
                  <Link
                    href="/pairings/constructor"
                    className="block px-4 py-2 text-sm text-zinc-700 hover:bg-primary-50 hover:text-primary-700"
                    onClick={() => setShowPairingsMenu(false)}
                  >
                    Конструктор
                  </Link>
                  <Link
                    href="/pairings/game"
                    className="block px-4 py-2 text-sm text-zinc-700 hover:bg-primary-50 hover:text-primary-700"
                    onClick={() => setShowPairingsMenu(false)}
                  >
                    Угадай пару
                  </Link>
                </nav>
              )}
            </div>
            <Link
              href="/tests"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-0 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 transition-all"
              aria-label="Тесты и рейтинг"
            >
              <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">Тесты</span>
            </Link>
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
