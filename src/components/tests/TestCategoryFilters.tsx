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
    <div className="space-y-4 mb-6">
      <div className="flex flex-wrap gap-x-2 gap-y-2.5">
        <button
          type="button"
          onClick={() => onCategorySelect(null)}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
            selectedCategory === null
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-surface-raised text-stone-700 border-stone-200 hover:border-primary-300 hover:bg-primary-50/40"
          }`}
        >
          Все ({totalCount})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategorySelect(category)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${
              selectedCategory === category
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-surface-raised text-stone-700 border-stone-200 hover:border-primary-300 hover:bg-primary-50/40"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <p className="text-sm text-stone-500 leading-relaxed">
        {selectedCategory
          ? `В категории «${selectedCategory}»: ${filteredCount}`
          : `Всего тестов: ${filteredCount}`}
      </p>
    </div>
  );
}
