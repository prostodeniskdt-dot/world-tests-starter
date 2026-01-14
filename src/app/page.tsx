"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocalUser } from "@/components/UserGate";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { TestCategories } from "@/components/TestCategories";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Spinner } from "@/components/Spinner";

type Test = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficultyLevel: 1 | 2 | 3;
};

export default function Page() {
  const { user, isLoading } = useLocalUser();
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [testsLoading, setTestsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setTestsLoading(true);
      fetch("/api/tests")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setTests(data.tests || []);
            setCategories(data.categories || []);
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

  const filteredTests = useMemo(() => {
    return selectedCategory
      ? tests.filter(t => t.category === selectedCategory)
      : tests;
  }, [tests, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <div className="text-zinc-600">Загрузка...</div>
          </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Левая колонка: Тесты */}
        <div className="space-y-6 flex flex-col">
          {user ? (
            <>
              <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-8">
                <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Доступные тесты
                </h1>
                <p className="text-zinc-600 mb-8 text-base leading-relaxed">
                  Выберите тест для прохождения. Результаты влияют на ваш рейтинг.
                </p>

                {/* Компонент категорий */}
                <TestCategories
                  tests={tests}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                />

                {testsLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-4">
                    {filteredTests.map((test) => (
                      <div 
                        key={test.id} 
                        className="group border-2 border-zinc-200 rounded-xl p-6 hover:shadow-lg hover:border-primary-300 transition-all bg-white"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <BookOpen className="h-5 w-5 text-primary-600" aria-hidden="true" />
                              <h3 className="font-bold text-xl text-zinc-900">{test.title}</h3>
                              <div className="flex items-center gap-1 ml-auto">
                                {Array.from({ length: test.difficultyLevel }).map((_, i) => (
                                  <span key={i} className="text-amber-600 text-lg" aria-label={`Барная ложка ${i + 1}`}>
                                    🥄
                                  </span>
                                ))}
                              </div>
                            </div>
                            {test.description && (
                              <p className="text-zinc-600 mt-2 leading-relaxed">{test.description}</p>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/test?testId=${test.id}`}
                          className="inline-flex items-center gap-2 mt-4 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all group-hover:scale-105"
                        >
                          Пройти тест
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </Link>
                      </div>
                    ))}
                    {filteredTests.length === 0 && (
                      <div className="text-center py-12 text-zinc-500">
                        {selectedCategory 
                          ? `Пока нет тестов в категории "${selectedCategory}"`
                          : "Пока нет доступных тестов"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-8 h-full">
              <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                King of the Bar
              </h1>
              <div className="space-y-6 text-zinc-700 leading-relaxed">
                <p className="text-lg font-medium text-zinc-900">
                  Добро пожаловать на платформу для соревновательных тестов!
                </p>
                <div className="space-y-4">
                  <h2 className="font-bold text-xl text-zinc-900">О проекте</h2>
                  <p className="text-base leading-relaxed">
                    King of the Bar — это интерактивная платформа, где вы можете проверить свои знания, 
                    пройти увлекательные тесты и соревноваться с другими участниками в мировом рейтинге.
                  </p>
                  <p className="mt-6 text-zinc-600 bg-primary-50 p-4 rounded-lg border border-primary-200">
                    Начните свой путь к вершине рейтинга уже сегодня! Войдите или зарегистрируйтесь, 
                    чтобы получить доступ к тестам и начать зарабатывать очки.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка: Рейтинг */}
        <div className="flex flex-col">
          <LiveLeaderboard />
        </div>
      </div>
    </div>
  );
}
