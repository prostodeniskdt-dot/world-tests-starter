"use client";

import { useEffect, useState } from "react";
import { useLocalUser } from "@/components/UserGate";
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
  const [testsLoading, setTestsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setTestsLoading(true);
      fetch("/api/tests")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setTests(data.tests || []);
          }
        })
        .catch((err) => {
          console.error("Ошибка загрузки тестов:", err);
        })
        .finally(() => setTestsLoading(false));
    } else {
      setTestsLoading(false);
    }
  }, [user]);

  // Показываем загрузку только при первой проверке авторизации
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-600">Загрузка...</div>
      </div>
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
            {user ? (
              <>
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
                        <div key={test.id} className="border-2 border-amber-200 rounded-xl p-5 bg-gradient-to-br from-white to-amber-50/50 hover:shadow-xl hover:border-amber-300 transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-xl text-amber-900">{test.title}</h3>
                              {test.description && (
                                <p className="text-sm text-zinc-700 mt-2">{test.description}</p>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/test?testId=${test.id}`}
                            className="inline-block mt-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                          >
                            Пройти тест →
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
              </>
            ) : (
              <div className="rounded-md border bg-white p-6">
                <h1 className="text-2xl font-bold mb-4">King of the Bar</h1>
                <div className="space-y-4 text-zinc-700">
                  <p className="text-lg">
                    Добро пожаловать на платформу для соревновательных тестов!
                  </p>
                  <div className="space-y-3">
                    <h2 className="font-semibold text-lg">О проекте</h2>
                    <p>
                      King of the Bar — это интерактивная платформа, где вы можете проверить свои знания, 
                      пройти увлекательные тесты и соревноваться с другими участниками в мировом рейтинге.
                    </p>
                    <h2 className="font-semibold text-lg mt-4">Как это работает?</h2>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Регистрируйтесь и создайте свой аккаунт</li>
                      <li>Проходите тесты по различным темам</li>
                      <li>Зарабатывайте очки за правильные ответы</li>
                      <li>Соревнуйтесь с другими участниками и поднимайтесь в рейтинге</li>
                      <li>Следите за своим прогрессом и улучшайте результаты</li>
                    </ul>
                    <p className="mt-4 text-zinc-600">
                      Начните свой путь к вершине рейтинга уже сегодня! Войдите или зарегистрируйтесь, 
                      чтобы получить доступ к тестам и начать зарабатывать очки.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
