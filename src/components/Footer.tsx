"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { NAVIGATION_GROUPS } from "@/lib/sections";
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
      <footer className="border-t border-stone-200 bg-surface-raised/95 backdrop-blur-md py-8 sm:py-10 mt-10 sm:mt-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-xs sm:text-sm text-stone-600">
          <div className="grid gap-6 border-b border-stone-200/80 pb-6 sm:grid-cols-[1.3fr_2fr]">
            <div>
              <div className="font-display text-lg sm:text-xl font-semibold text-stone-950">
                {SITE_NAME}
              </div>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
                О напитках, сервисе и работе заведений — в тестах, статьях и справочниках.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {NAVIGATION_GROUPS.slice(0, 3).map((group) => (
                <div key={group.id}>
                  <h2 className="text-sm font-bold text-stone-900">{group.title}</h2>
                  <ul className="mt-2 space-y-1.5">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="hover:text-primary-700 hover:underline">
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-5">
            {DOC_LINKS.map(({ slug, label }) => (
              <button
                key={slug}
                type="button"
                onClick={() => setDocSlug(slug)}
                className="text-stone-600 hover:text-primary-700 hover:underline"
              >
                {label}
              </button>
            ))}
            <span className="ml-auto text-stone-400">
              © {new Date().getFullYear()} {SITE_NAME}
            </span>
          </div>
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
