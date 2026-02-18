"use client";

import { useState, useEffect } from "react";
import { DocModal } from "./DocModal";

const STORAGE_KEY = "cookies_consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === null) setVisible(true);
  }, []);

  const hide = (choice: "accepted" | "declined") => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  const handleAccept = async () => {
    try {
      await fetch("/api/consent/cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
    } catch {
      // ignore
    }
    hide("accepted");
  };

  const handleDecline = () => {
    hide("declined");
  };

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white border-t border-zinc-200 shadow-lg"
        role="dialog"
        aria-label="Согласие на использование cookies"
      >
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-zinc-700 flex-1">
            Мы используем cookies для авторизации и работы сайта.{" "}
            <button
              type="button"
              onClick={() => setShowDoc(true)}
              className="text-primary-600 hover:underline"
            >
              Политика cookies
            </button>
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleDecline}
              className="px-4 py-2 text-sm rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >
              Отклонить
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              Принять
            </button>
          </div>
        </div>
      </div>
      <DocModal slug="cookies" isOpen={showDoc} onClose={() => setShowDoc(false)} />
    </>
  );
}
