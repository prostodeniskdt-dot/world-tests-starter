"use client";

import { useState, useEffect } from "react";
import { PairingsSearch } from "@/components/pairings/PairingsSearch";
import { PairingsResult } from "@/components/pairings/PairingsResult";
import { BookOpen } from "lucide-react";

type FlavorPairingResult = {
  mainIngredient: string;
  pairedIngredients: string[];
  mainCategory: string;
};

export default function PairingsPage() {
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(
    null
  );
  const [result, setResult] = useState<FlavorPairingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedIngredient) {
      setResult(null);
      return;
    }
    setLoading(true);
    fetch(
      `/api/flavor-pairings?ingredient=${encodeURIComponent(selectedIngredient)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setResult({
            mainIngredient: data.mainIngredient,
            pairedIngredients: data.pairedIngredients ?? [],
            mainCategory: data.mainCategory ?? "other",
          });
        } else {
          setResult(null);
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [selectedIngredient]);

  const handleSelectIngredient = (ingredient: string) => {
    setSelectedIngredient(ingredient);
  };

  const handleSelectTag = (ingredient: string) => {
    setSelectedIngredient(ingredient);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary-600" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Справочник сочетаний
          </h1>
        </div>
        <p className="text-zinc-600 leading-relaxed">
          Найди ингредиент и узнай, что с ним сочетается. Кликни по тегу, чтобы
          посмотреть сочетания для него.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-6 mb-6">
        <PairingsSearch
          onSelectIngredient={handleSelectIngredient}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
        />
      </div>

      <PairingsResult
        result={result}
        loading={loading}
        onSelectTag={handleSelectTag}
      />
    </div>
  );
}
