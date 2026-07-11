"use client";

import { useMemo, useState, useEffect } from "react";
import { useLocalUser } from "@/components/UserGate";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { Search } from "lucide-react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Spinner } from "@/components/Spinner";
import { LoginModal } from "@/components/LoginModal";
import { TestCard, type TestCardItem } from "@/components/tests/TestCard";
import { TestCategoryFilters } from "@/components/tests/TestCategoryFilters";
import { TestPagination, paginateItems } from "@/components/tests/TestPagination";

const PAGE_SIZE = 6;

type SortMode = "title" | "difficulty";

export default function TestsPage() {
  const { user, isLoading } = useLocalUser();
  const [tests, setTests] = useState<TestCardItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("title");
  const [page, setPage] = useState(1);
  const [testsLoading, setTestsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setTestsLoading(true);
      fetch("/api/tests", { credentials: "include" })
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

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, search, sort]);

  const filteredTests = useMemo(() => {
    let list = selectedCategory
      ? tests.filter((t) => t.category === selectedCategory)
      : [...tests];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sort === "difficulty") return a.difficultyLevel - b.difficultyLevel;
      return a.title.localeCompare(b.title, "ru");
    });

    return list;
  }, [tests, selectedCategory, search, sort]);

  const pageItems = paginateItems(filteredTests, page, PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <div className="text-stone-600">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoginModal />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)] gap-8 xl:gap-10 items-start">
          <div className="min-w-0">
            {user ? (
              <div className="surface-card p-6 sm:p-8 lg:p-10">
                <header className="mb-8 max-w-2xl">
                  <h1 className="font-display text-h2 text-stone-950">Доступные тесты</h1>
                  <p className="mt-3 text-body text-stone-600 leading-relaxed">
                    Выберите тест для прохождения. Результаты влияют на ваш рейтинг.
                  </p>
                </header>

                <TestCategoryFilters
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  totalCount={tests.length}
                  filteredCount={filteredTests.length}
                />

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Поиск по названию или описанию"
                      className="w-full min-h-11 pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                    className="min-h-11 border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-surface-raised"
                    aria-label="Сортировка"
                  >
                    <option value="title">По названию</option>
                    <option value="difficulty">По сложности</option>
                  </select>
                </div>

                {testsLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <>
                    {pageItems.length > 0 ? (
                      <div className="grid grid-cols-1 gap-5">
                        {pageItems.map((test) => (
                          <TestCard key={test.id} test={test} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-14 text-stone-500 text-sm leading-relaxed">
                        {selectedCategory
                          ? `Нет тестов в категории «${selectedCategory}»`
                          : search
                            ? "Ничего не найдено"
                            : "Пока нет доступных тестов"}
                      </div>
                    )}
                    <div className="mt-8">
                      <TestPagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        total={filteredTests.length}
                        onPageChange={setPage}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="surface-card p-6 sm:p-10">
                <h1 className="font-display text-h1 mb-5 text-stone-950">Тесты и рейтинг</h1>
                <div className="space-y-5 text-stone-700 leading-relaxed max-w-2xl">
                  <p className="text-body-lg text-stone-900">
                    Проверьте свои знания, пройдите тесты и соревнуйтесь с другими участниками в
                    мировом рейтинге.
                  </p>
                  <p className="text-stone-600 bg-primary-50 p-5 rounded-xl border border-primary-200 leading-relaxed">
                    Войдите или зарегистрируйтесь, чтобы получить доступ к тестам и начать
                    зарабатывать очки.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col xl:sticky xl:top-28" id="leaderboard">
            <LiveLeaderboard />
          </div>
        </div>
      </div>
    </>
  );
}
