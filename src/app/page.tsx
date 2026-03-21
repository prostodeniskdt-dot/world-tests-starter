"use client";

import Link from "next/link";
import { SECTIONS } from "@/lib/sections";
import { SITE_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          {SITE_NAME}
        </h1>
        <p className="text-zinc-600 text-base sm:text-lg max-w-2xl mx-auto">
          Образовательная платформа для барменов и работников HoReCa
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.id}
              href={section.href}
              className="group flex flex-col rounded-xl border-2 border-zinc-200 bg-white p-6 sm:p-8 hover:border-primary-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600 mb-4 group-hover:bg-primary-200 transition-colors">
                <Icon className="h-7 w-7" aria-hidden />
              </div>
              <h2 className="font-bold text-lg sm:text-xl text-zinc-900 mb-2 group-hover:text-primary-700 transition-colors">
                {section.title}
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed flex-1">
                {section.description}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary-600 group-hover:underline">
                Перейти →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
