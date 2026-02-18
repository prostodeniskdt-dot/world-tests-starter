"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { DocModal } from "./DocModal";

const DOC_LINKS: { slug: string; label: string }[] = [
  { slug: "pdn", label: "Политика ПДн" },
  { slug: "consent", label: "Согласие на обработку ПДн" },
  { slug: "distribution", label: "Согласие на распространение" },
  { slug: "agreement", label: "Пользовательское соглашение" },
  { slug: "cookies", label: "Cookies" },
  { slug: "contacts", label: "Контакты" },
];

export function Footer() {
  const [docSlug, setDocSlug] = useState<string | null>(null);

  return (
    <>
      <footer className="border-t border-zinc-200 bg-white/95 backdrop-blur-sm py-6 sm:py-8 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 text-xs sm:text-sm text-zinc-600">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary-600" />
            <span className="font-semibold text-zinc-900">King of the Bar</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-2">
            {DOC_LINKS.map(({ slug, label }) => (
              <button
                key={slug}
                type="button"
                onClick={() => setDocSlug(slug)}
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-center">Next.js + PostgreSQL • {new Date().getFullYear()}</div>
        </div>
      </footer>
      <DocModal
        slug={docSlug ?? ""}
        isOpen={docSlug !== null}
        onClose={() => setDocSlug(null)}
      />
    </>
  );
}
