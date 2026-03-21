"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/sections";

export function SectionNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-zinc-200 bg-white overflow-x-auto"
      aria-label="Разделы сайта"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex gap-1 py-2 min-w-max sm:min-w-0">
          {SECTIONS.map((section) => {
            const isActive =
              pathname === section.href ||
              (section.href !== "/" && pathname.startsWith(section.href + "/"));
            return (
              <Link
                key={section.id}
                href={section.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary-100 text-primary-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {section.title}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
