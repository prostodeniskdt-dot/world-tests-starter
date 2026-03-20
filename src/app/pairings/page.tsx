"use client";

import Link from "next/link";
import { BookOpen, Plus, Gamepad2 } from "lucide-react";

const PAIRINGS_SUBS = [
  {
    id: "reference",
    title: "Справочник",
    description: "Найди ингредиент и узнай, что с ним сочетается",
    href: "/pairings/reference",
    icon: BookOpen,
  },
  {
    id: "constructor",
    title: "Конструктор",
    description: "Выбери ингредиенты — получи идеи для рецепта",
    href: "/pairings/constructor",
    icon: Plus,
  },
  {
    id: "game",
    title: "Угадай пару",
    description: "Мини-игра: выбери сочетающиеся ингредиенты",
    href: "/pairings/game",
    icon: Gamepad2,
  },
];

export default function PairingsHubPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Сочетания вкусов
          </h1>
        </div>
        <p className="text-zinc-600 leading-relaxed">
          Мини-игра и база знаний о сочетаниях вкусов. Выберите раздел:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PAIRINGS_SUBS.map((sub) => {
          const Icon = sub.icon;
          return (
            <Link
              key={sub.id}
              href={sub.href}
              className="group flex flex-col rounded-xl border-2 border-zinc-200 bg-white p-6 hover:border-primary-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4 group-hover:bg-primary-200">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h2 className="font-bold text-lg text-zinc-900 mb-2">
                {sub.title}
              </h2>
              <p className="text-sm text-zinc-600 flex-1">{sub.description}</p>
              <span className="mt-4 text-sm font-semibold text-primary-600 group-hover:underline">
                Перейти →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
