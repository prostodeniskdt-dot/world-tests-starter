"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

type PairingsSearchProps = {
  onSelectIngredient: (ingredient: string) => void;
  categoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
};

const CATEGORY_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: "Все" },
  { value: "fruits", label: "Фрукты" },
  { value: "herbs_spices", label: "Травы и специи" },
  { value: "other", label: "Другое" },
];

export function PairingsSearch({
  onSelectIngredient,
  categoryFilter,
  onCategoryFilterChange,
}: PairingsSearchProps) {
  const [query, setQuery] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setLoading(true);
    const url = categoryFilter
      ? `/api/flavor-pairings?category=${categoryFilter}`
      : "/api/flavor-pairings?list=1";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.ingredients) setIngredients(data.ingredients);
        else setIngredients([]);
      })
      .catch(() => setIngredients([]))
      .finally(() => setLoading(false));
  }, [categoryFilter]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(ingredients.slice(0, 30));
    } else {
      setFiltered(
        ingredients.filter((i) => i.toLowerCase().includes(q)).slice(0, 30)
      );
    }
  }, [query, ingredients]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [filtered]);

  const handleSelect = (ing: string) => {
    onSelectIngredient(ing);
    setQuery(ing);
    setShowDropdown(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowDropdown(true);
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && showDropdown && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(filtered[activeIndex]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value ?? "all"}
            onClick={() => onCategoryFilterChange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              categoryFilter === opt.value
                ? "bg-primary-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Введите ингредиент: яблоко, имбирь, мята..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          aria-label="Поиск ингредиента"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="pairings-ingredient-options"
          aria-activedescendant={
            activeIndex >= 0 ? `pairings-option-${activeIndex}` : undefined
          }
        />
        {showDropdown && (
          <ul
            id="pairings-ingredient-options"
            className="absolute z-10 w-full mt-1 bg-white border-2 border-zinc-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
            role="listbox"
          >
            {loading ? (
              <li className="px-4 py-3 text-zinc-500">Загрузка...</li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-zinc-500">
                {query ? "Ничего не найдено" : "Введите для поиска"}
              </li>
            ) : (
              filtered.map((ing, index) => (
                <li
                  key={ing}
                  id={`pairings-option-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(ing)}
                  className={`px-4 py-2 cursor-pointer outline-none ${
                    activeIndex === index ? "bg-primary-50" : "hover:bg-primary-50"
                  }`}
                >
                  {ing}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
