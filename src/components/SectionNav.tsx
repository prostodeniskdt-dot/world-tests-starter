"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import {
  NAVIGATION_GROUPS,
  isNavigationItemActive,
} from "@/lib/sections";

export function SectionNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const matchingGroups = NAVIGATION_GROUPS.filter((group) =>
    group.items.some((item) => isNavigationItemActive(pathname, item.href))
  );
  const activeGroupId =
    matchingGroups.find((group) => group.id === "contribute")?.id ??
    matchingGroups[0]?.id;

  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="border-t border-stone-100 bg-surface-raised/80"
      aria-label="Основные разделы сайта"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex min-h-11 items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-zinc-800">Разделы сайта</span>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-expanded={mobileOpen}
            aria-controls="mobile-section-navigation"
            aria-label={mobileOpen ? "Закрыть меню разделов" : "Открыть меню разделов"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div
            id="mobile-section-navigation"
            className="max-h-[calc(100dvh-var(--site-header-height,7rem))] overflow-y-auto border-t border-zinc-100 py-3 md:hidden"
          >
            {NAVIGATION_GROUPS.map((group) => {
              return (
                <div key={group.id} className="border-b border-zinc-100 px-1 pb-3 pt-2 first:pt-0 last:border-0">
                  <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {group.title}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        aria-current={
                          isNavigationItemActive(pathname, item.href) ? "page" : undefined
                        }
                        className={`flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm ${
                          isNavigationItemActive(pathname, item.href)
                            ? "bg-primary-50 font-semibold text-primary-700"
                            : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="hidden items-center gap-1 py-2 md:flex">
          {NAVIGATION_GROUPS.map((group) => {
            const isActive = activeGroupId === group.id;
            const isOpen = openGroup === group.id;
            const panelId = `desktop-navigation-${group.id}`;
            return (
              <div key={group.id} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? null : group.id)}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    group.id === "contribute"
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-haspopup="menu"
                >
                  {group.title}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="menu"
                    className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl"
                  >
                    <div className="px-3 pb-2 pt-1 text-xs text-zinc-500">
                      {group.description}
                    </div>
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        role="menuitem"
                        aria-current={
                          isNavigationItemActive(pathname, item.href) ? "page" : undefined
                        }
                        className={`block rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 ${
                          isNavigationItemActive(pathname, item.href)
                            ? "bg-primary-50 text-primary-800"
                            : "hover:bg-zinc-50"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                          {item.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
