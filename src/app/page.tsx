"use client";

import { useEffect, useState } from "react";
import { useLocalUser } from "@/components/UserGate";
import { AuthPage } from "@/components/AuthPage";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import Link from "next/link";

type Test = {
  id: string;
  title: string;
  description: string | null;
};

export default function Page() {
  const { user, isLoading } = useLocalUser();
  const [tests, setTests] = useState<Test[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch("/api/tests")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setTests(data.tests || []);
          }
        })
        .finally(() => setTestsLoading(false));
    }
  }, [user]);

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-600">Загрузка...</div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем страницу входа
  if (!user) {
    return <AuthPage />;
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

            {testsLoading ? (
              <div className="text-zinc-500">Загрузка тестов...</div>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{test.title}</h3>
                        {test.description && (
                          <p className="text-sm text-zinc-600 mt-1">{test.description}</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/test?testId=${test.id}`}
                      className="inline-block mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 transition-colors"
                    >
                      Пройти тест
                    </Link>
                  </div>
                ))}
                {tests.length === 0 && (
                  <div className="text-zinc-500">Пока нет доступных тестов</div>
                )}
              </div>
            )}
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
