"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "site_alcohol_disclaimer_v1";

export function SectionDisclaimerGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useLayoutEffect(() => {
    try {
      setAccepted(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setAccepted(false);
    }
    setReady(true);
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setAccepted(true);
  };

  const leave = () => {
    if (typeof window !== "undefined") window.location.href = "/";
  };

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-zinc-400 text-sm">
        Загрузка…
      </div>
    );
  }

  if (!accepted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="disclaimer-title"
          className="max-w-lg w-full rounded-xl border border-zinc-200 bg-white shadow-xl p-6 sm:p-8"
        >
          <h2 id="disclaimer-title" className="text-lg font-bold text-zinc-900 mb-3">
            Информация об алкогольной продукции
          </h2>
          <div className="text-sm text-zinc-700 space-y-3 leading-relaxed">
            <p>
              Раздел содержит сведения об алкогольной продукции и рецептурах. Доступ предназначен только для
              лиц, достигших возраста 18 лет.
            </p>
            <p>
              Материалы носят ознакомительный и образовательный характер. Администрация не рекламирует
              чрезмерное употребление алкоголя и не призывает к нарушению законодательства.
            </p>
            <p className="text-zinc-600">
              Продолжая, вы подтверждаете, что вам исполнилось 18 лет и вы осознаёте ответственность за
              использование информации.
            </p>
          </div>
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={leave}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-zinc-300 text-zinc-700 text-sm font-medium hover:bg-zinc-50"
            >
              Выйти на главную
            </button>
            <button
              type="button"
              onClick={accept}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              Мне есть 18 лет, продолжить
            </button>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            <Link href="/" className="text-primary-600 hover:underline">
              На главную
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
