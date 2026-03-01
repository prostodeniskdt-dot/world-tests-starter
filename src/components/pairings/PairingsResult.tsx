"use client";

type FlavorPairingResult = {
  mainIngredient: string;
  pairedIngredients: string[];
  mainCategory: string;
};

type PairingsResultProps = {
  result: FlavorPairingResult | null;
  loading: boolean;
  onSelectTag: (ingredient: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  fruits: "Фрукты и ягоды",
  herbs_spices: "Травы и специи",
  other: "Другое",
};

export function PairingsResult({
  result,
  loading,
  onSelectTag,
}: PairingsResultProps) {
  if (loading) {
    return (
      <div className="rounded-xl border-2 border-zinc-200 bg-white p-8 text-center text-zinc-500">
        Загрузка...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border-2 border-zinc-200 bg-white p-8 text-center text-zinc-500">
        Выберите ингредиент для просмотра сочетаний
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[result.mainCategory] ?? result.mainCategory;

  return (
    <div className="rounded-xl border-2 border-zinc-200 bg-white shadow-soft overflow-hidden">
      <div className="bg-primary-50 border-b border-primary-200 px-6 py-4">
        <h2 className="text-xl font-bold text-zinc-900">{result.mainIngredient}</h2>
        <p className="text-sm text-zinc-600 mt-1">{categoryLabel}</p>
      </div>
      <div className="p-6">
        <p className="text-sm text-zinc-600 mb-4">
          Сочетается с ({result.pairedIngredients.length} ингредиентов):
        </p>
        <div className="flex flex-wrap gap-2">
          {result.pairedIngredients.map((ing) => (
            <button
              key={ing}
              onClick={() => onSelectTag(ing)}
              className="inline-flex items-center rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-primary-100 hover:text-primary-800 transition-colors"
            >
              {ing}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
