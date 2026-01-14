"use client";

import { BookOpen } from "lucide-react";

type Test = {
  id: string;
  title: string;
  description: string | null;
  category: string;
};

type TestCategoriesProps = {
  tests: Test[];
  categories: string[];
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
};

export function TestCategories({
  tests,
  categories,
  onCategorySelect,
  selectedCategory,
}: TestCategoriesProps) {
  const getTestsCount = (category: string | null) => {
    if (category === null) {
      return tests.length;
    }
    return tests.filter(t => t.category === category).length;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Кнопка "Все тесты" */}
      <button
        onClick={() => onCategorySelect(null)}
        className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
          selectedCategory === null
            ? "border-primary-500 bg-primary-50 shadow-md"
            : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50"
        }`}
        aria-label="Показать все тесты"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <div>
              <div className="font-bold text-lg text-zinc-900">Все тесты</div>
              <div className="text-sm text-zinc-600">{getTestsCount(null)} тестов</div>
            </div>
          </div>
          {selectedCategory === null && (
            <div className="h-2 w-2 rounded-full bg-primary-600"></div>
          )}
        </div>
      </button>

      {/* Категории */}
      <div className="space-y-2">
        {categories.map((category) => {
          const count = getTestsCount(category);
          const isSelected = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50 shadow-md"
                  : "border-zinc-200 hover:border-primary-300 hover:bg-zinc-50"
              }`}
              aria-label={`Показать тесты категории ${category}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-zinc-900 capitalize">
                    {category}
                  </div>
                  <div className="text-sm text-zinc-600">
                    {count} {count === 1 ? "тест" : "тестов"}
                  </div>
                </div>
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary-600"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
