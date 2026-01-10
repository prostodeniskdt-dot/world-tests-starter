"use client";

import { useLocalUser } from "@/components/UserGate";
import { LoginModal } from "@/components/LoginModal";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { TEST_1_PUBLIC } from "@/tests/test-1.public";
import Link from "next/link";

export default function Page() {
  const { user } = useLocalUser();

  if (!user) {
    return (
      <>
        <LoginModal />
        <div className="space-y-6">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold mb-4">World Tests</h1>
            <p className="text-zinc-600">
              Пожалуйста, войдите через Telegram для доступа к тестам и рейтингу
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка: Рейтинг */}
        <div className="lg:col-span-1">
          <LiveLeaderboard />
        </div>

        {/* Правая колонка: Тесты */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-md border bg-white p-6">
            <h1 className="text-2xl font-bold mb-2">Доступные тесты</h1>
            <p className="text-zinc-600 mb-6">
              Выберите тест для прохождения. Результаты влияют на ваш рейтинг.
            </p>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{TEST_1_PUBLIC.title}</h3>
                    <p className="text-sm text-zinc-600 mt-1">
                      {TEST_1_PUBLIC.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
                  <span>{TEST_1_PUBLIC.questions.length} вопросов</span>
                </div>
                <Link
                  href="/test"
                  className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 transition-colors"
                >
                  Пройти тест
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-white p-4">
            <h2 className="font-semibold mb-3">Как это работает?</h2>
            <ul className="space-y-2 text-sm text-zinc-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Проходите тесты и зарабатывайте очки</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Ваш результат автоматически попадает в рейтинг</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Рейтинг обновляется в реальном времени</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Соревнуйтесь с другими участниками</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
