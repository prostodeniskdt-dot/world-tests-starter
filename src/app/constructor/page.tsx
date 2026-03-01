"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

type PairingsMap = Record<string, string[]>;

function computeBridges(
  selected: string[],
  pairingsMap: PairingsMap
): string[] {
  if (selected.length === 0) return [];
  let acc = pairingsMap[selected[0]] ?? [];
  for (let i = 1; i < selected.length; i++) {
    const next = pairingsMap[selected[i]] ?? [];
    acc = acc.filter((p) => next.includes(p));
  }
  return acc.filter((b) => !selected.includes(b));
}

function computeSuggestions(
  selected: string[],
  pairingsMap: PairingsMap,
  bridges: string[]
): string[] {
  const all = new Set<string>();
  selected.forEach((ing) =>
    (pairingsMap[ing] ?? []).forEach((p) => all.add(p))
  );
  selected.forEach((s) => all.delete(s));
  bridges.forEach((b) => all.delete(b));
  return [...all].slice(0, 30);
}

export default function ConstructorPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [pairingsMap, setPairingsMap] = useState<PairingsMap>({});
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/flavor-pairings?list=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.ingredients) setIngredients(data.ingredients);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selected.length === 0) {
      setPairingsMap({});
      return;
    }
    setLoading(true);
    fetch("/api/flavor-pairings/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: selected }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.pairings) {
          const map: PairingsMap = {};
          Object.entries(data.pairings).forEach(
            ([k, v]: [string, unknown]) => {
              map[k] = (v as { pairedIngredients: string[] }).pairedIngredients ?? [];
            }
          );
          setPairingsMap(map);
        } else {
          setPairingsMap({});
        }
      })
      .catch(() => setPairingsMap({}))
      .finally(() => setLoading(false));
  }, [selected]);

  const bridges = computeBridges(selected, pairingsMap);
  const suggestions = computeSuggestions(selected, pairingsMap, bridges);

  const filteredIngredients = searchQuery.trim()
    ? ingredients
        .filter((i) =>
          i.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
        .filter((i) => !selected.includes(i))
        .slice(0, 20)
    : ingredients.filter((i) => !selected.includes(i)).slice(0, 20);

  const addIngredient = (ing: string) => {
    if (!selected.includes(ing)) setSelected([...selected, ing]);
    setSearchQuery("");
    setShowPicker(false);
  };

  const removeIngredient = (ing: string) => {
    setSelected(selected.filter((s) => s !== ing));
  };

  const ideas = bridges.length > 0
    ? bridges.slice(0, 5).map((b) =>
        selected.length >= 2
          ? `${selected.join(" + ")} + ${b}`
          : selected.length === 1
          ? `${selected[0]} + ${b}`
          : b
      )
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          Конструктор идей
        </h1>
        <p className="text-zinc-600 leading-relaxed">
          Выбери ингредиенты — получи идеи для рецепта. Общие «мосты» подходят ко
          всем выбранным.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-6 space-y-6">
        <div>
          <h2 className="font-bold text-lg text-zinc-900 mb-3">
            Выбранные ингредиенты
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-800"
              >
                {ing}
                <button
                  onClick={() => removeIngredient(ing)}
                  className="rounded p-0.5 hover:bg-primary-200"
                  aria-label={`Удалить ${ing}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить ингредиент
          </button>
          {showPicker && (
            <div className="mt-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск ингредиента..."
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 mb-3"
              />
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {filteredIngredients.map((ing) => (
                  <button
                    key={ing}
                    onClick={() => addIngredient(ing)}
                    className="rounded-lg bg-white border border-zinc-200 px-3 py-1.5 text-sm hover:bg-primary-50 hover:border-primary-300"
                  >
                    {ing}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && selected.length > 0 && (
          <p className="text-zinc-500">Загрузка сочетаний...</p>
        )}

        {!loading && selected.length > 0 && (
          <>
            {bridges.length > 0 && (
              <div>
                <h2 className="font-bold text-lg text-zinc-900 mb-2">
                  Общие «мосты» (подходят ко всем)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {bridges.map((b) => (
                    <span
                      key={b}
                      className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div>
                <h2 className="font-bold text-lg text-zinc-900 mb-2">
                  Что ещё добавить
                </h2>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 20).map((s) => (
                    <button
                      key={s}
                      onClick={() => addIngredient(s)}
                      className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-primary-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {ideas.length > 0 && (
              <div>
                <h2 className="font-bold text-lg text-zinc-900 mb-2">Идеи</h2>
                <ul className="space-y-2">
                  {ideas.map((idea, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-primary-50 px-4 py-2 text-sm text-zinc-800"
                    >
                      • {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {selected.length === 0 && (
          <p className="text-zinc-500">
            Добавь ингредиенты, чтобы увидеть сочетания и идеи.
          </p>
        )}
      </div>
    </div>
  );
}
