"use client";

type TestCategoryFiltersProps = {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  totalCount: number;
  filteredCount: number;
};

export function TestCategoryFilters({
  categories,
  selectedCategory,
  onCategorySelect,
  totalCount,
  filteredCount,
}: TestCategoryFiltersProps) {
  return (
    <div className="space-y-3 mb-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategorySelect(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selectedCategory === null
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-white text-zinc-700 border-zinc-200 hover:border-primary-300"
          }`}
        >
          Все ({totalCount})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategorySelect(category)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors ${
              selectedCategory === category
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-primary-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        {selectedCategory
          ? `В категории «${selectedCategory}»: ${filteredCount}`
          : `Всего тестов: ${filteredCount}`}
      </p>
    </div>
  );
}
